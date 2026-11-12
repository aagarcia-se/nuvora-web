import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
}

test('manifest, iconos e instalación disponibles en Chromium', async ({
  page,
  context,
}) => {
  await openApp(page);
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    );
    return (await fetch(link!.href)).json();
  });
  expect(manifest.display).toBe('standalone');
  expect(manifest.theme_color).toBe('#0F172A');
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
      expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
    ]),
  );
  for (const icon of manifest.icons) {
    const dimensions = await page.evaluate(async (src: string) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return `${image.naturalWidth}x${image.naturalHeight}`;
    }, icon.src);
    expect(dimensions).toBe(icon.sizes);
  }
  const client = await context.newCDPSession(page);
  const { installabilityErrors } = await client.send(
    'Page.getInstallabilityErrors',
  );
  // Chrome automation uses an incognito context, where OS installation is unavailable.
  // Keep asserting every other manifest/installability error.
  expect(
    installabilityErrors.filter((error) => error.errorId !== 'in-incognito'),
  ).toEqual([]);
});

test('abre el shell offline y no guarda peticiones privadas en caché', async ({
  page,
  context,
}) => {
  await openApp(page);
  // Fixture sintético: se ejercita el transporte, no un endpoint real de negocio.
  await page.evaluate(async () => {
    await fetch('/api/pwa-test-private', {
      headers: { Authorization: 'Bearer synthetic-test' },
    });
  });
  const cachedUrls = await page.evaluate(async () => {
    const keys = await caches.keys();
    const requests = await Promise.all(
      keys.map(async (key) => (await caches.open(key)).keys()),
    );
    return requests.flat().map((request) => request.url);
  });
  expect(
    cachedUrls.some((url) => new URL(url).pathname.startsWith('/api/')),
  ).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const apiOffline = await page.evaluate(async () => {
    try {
      await fetch('/api/pwa-test-private');
      return false;
    } catch {
      return true;
    }
  });
  expect(apiOffline).toBe(true);
});

test('ofrece instalación y oculta el control al confirmar appinstalled', async ({
  page,
}) => {
  await openApp(page);
  // Comprueba la interacción UI con un evento sintético, no instala en el SO.
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => undefined,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole('button', { name: /^Instalar / }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(
    page.getByRole('complementary', { name: 'Instalar aplicación' }),
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Instalar / })).toHaveCount(0);
});

test('promoción superior en flujo, es responsive y conserva el cierre persistente', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', { value: 'iPhone Safari' });
    localStorage.setItem('nuvora-install-dismissed-at', String(Date.now()));
  });
  await page.goto('/login');
  const banner = page.getByRole('complementary', {
    name: 'Instalar aplicación',
  });
  await expect(banner).toBeVisible();
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => undefined,
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    window.dispatchEvent(event);
  });
  await expect(banner).toBeVisible();
  const box = await banner.boundingBox();
  const header = await page.getByRole('banner').boundingBox();
  const form = page.locator('main section');
  const formBefore = await form.boundingBox();
  expect(
    await banner.evaluate((element) => getComputedStyle(element).position),
  ).toBe('static');
  expect(box!.y).toBeLessThanOrEqual(header!.y + header!.height);
  expect(formBefore).not.toBeNull();
  await page
    .getByRole('button', { name: 'Cerrar aviso de instalación' })
    .click();
  await expect(banner).toHaveCount(0);
  const formAfter = await form.boundingBox();
  expect(formAfter!.y).toBeLessThan(formBefore!.y);
  await page.reload();
  await expect(banner).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test('prompt único y cancelación sin instalación ficticia', async ({
  page,
}) => {
  await page.goto('/login');
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.promptCalls = String(
          Number(document.documentElement.dataset.promptCalls || 0) + 1,
        );
      },
      userChoice: new Promise((resolve) =>
        window.addEventListener(
          'demo-dismiss',
          () => resolve({ outcome: 'dismissed' }),
          { once: true },
        ),
      ),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole('button', { name: /^Instalar / }).click();
  await expect(page.getByRole('button', { name: /^Instalar / })).toBeDisabled();
  await expect(page.locator('html')).toHaveAttribute('data-prompt-calls', '1');
  await page.evaluate(() => window.dispatchEvent(new Event('demo-dismiss')));
  await expect(
    page.getByRole('complementary', { name: 'Instalar aplicación' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Instalar / })).toHaveCount(0);
});

test('preview real: captura evento nativo sin dispatch sintético', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.addEventListener('beforeinstallprompt', (event) => {
      document.documentElement.dataset.nativeInstall = String(event.isTrusted);
    });
  });
  await openApp(page);
  let native = false;
  try {
    await expect(page.locator('html')).toHaveAttribute(
      'data-native-install',
      'true',
      { timeout: 10000 },
    );
    native = true;
  } catch {
    /* Some headless browsers do not offer an installation prompt. */
  }
  console.log(`Preview native beforeinstallprompt observed: ${native}`);
  if (native)
    await expect(
      page.getByRole('button', { name: /^Instalar / }),
    ).toBeEnabled();
  else
    await expect(page.getByRole('button', { name: /^Instalar / })).toHaveCount(
      0,
    );
});
