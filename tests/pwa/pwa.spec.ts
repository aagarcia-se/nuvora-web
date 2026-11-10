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
  expect(manifest.theme_color).toBe('#047857');
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
  expect(installabilityErrors).toEqual([]);
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
    page.getByText('Estás usando la aplicación instalada.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Instalar / })).toHaveCount(0);
});
