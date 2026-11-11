import { test, expect, type Page } from '@playwright/test';
test('promoción en desarrollo sin CTA operativo antes del evento', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('complementary', { name: 'Instalar aplicación' })).toContainText('Modo desarrollo');
  await expect(page.getByRole('button', { name: 'Instalar Nuvora' })).toBeDisabled();
});
const user = {
  id: 'demo-user',
  email: 'contador@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.demo-signature`;
async function mocks(page: Page) {
  await page.route('https://auth.demo.test/auth/v1/**', async (route) => {
    if (route.request().url().includes('/logout'))
      return route.fulfill({ status: 204 });
    await route.fulfill({ json: user });
  });
  await page.route('http://api.demo.test/api/v1/auth/signin', (route) =>
    route.fulfill({
      json: {
        user,
        session: { access_token: token, refresh_token: 'demo-refresh-fixture' },
      },
    }),
  );
  await page.route('http://api.demo.test/api/v1/auth/me', (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`);
    return route.fulfill({
      json: { user: { id: user.id, email: user.email } },
    });
  });
}
async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page
    .getByLabel('Contraseña', { exact: true })
    .fill('Demo-only-password');
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click();
}
test('Demo: login SDK, identidad API, recarga y logout', async ({ page }) => {
  await mocks(page);
  await login(page);
  await expect(
    page.getByRole('heading', { name: 'Te damos la bienvenida' }),
  ).toBeVisible();
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await page.goto('/login');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Te damos la bienvenida' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
});
test('Demo: validación, mostrar contraseña, 401 y reenvío', async ({
  page,
}) => {
  await mocks(page);
  await page.goto('/login');
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('Revisa');
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page.route(
    '**/api/v1/auth/signin',
    (route) =>
      route.fulfill({ status: 401, json: { error: 'AUTH_SIGNIN_FAILED' } }),
    { times: 1 },
  );
  await login(page);
  await expect(page.getByRole('alert')).toContainText('inválidos');
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Te damos la bienvenida' }),
  ).toBeVisible();
});
test('Demo: error /me recuperable conserva sesión; 401 exige reautenticación', async ({
  page,
}) => {
  await mocks(page);
  await page.route(
    '**/api/v1/auth/me',
    (route) => route.fulfill({ status: 503 }),
    { times: 1 },
  );
  await login(page);
  await expect(
    page.getByRole('heading', { name: 'No pudimos verificar tu sesión' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Te damos la bienvenida' }),
  ).toBeVisible();
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ status: 401 }),
  );
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});
for (const status of [429, 500])
  test(`Demo: signin ${status} sin reintento automático`, async ({ page }) => {
    await mocks(page);
    let calls = 0;
    await page.route('**/api/v1/auth/signin', (route) => {
      calls++;
      return route.fulfill({ status });
    });
    await login(page);
    await expect(page.getByRole('alert')).toBeVisible();
    expect(calls).toBe(1);
  });
test('temas, teclado, tamaños responsive y standalone simulado', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true });
  });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/login');
  await expect(page.getByRole('complementary', { name: 'Instalar aplicación' })).toHaveCount(0);
  await expect(page.locator('html')).toHaveClass('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass('dark');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass('dark');
  await page.getByRole('button', { name: 'Modo claro' }).focus();
  await page.keyboard.press('Enter');
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass('dark');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).not.toHaveClass('dark');
  await page.getByRole('button', { name: 'Modo oscuro' }).click();
  await expect(page.getByRole('button', { name: 'Modo oscuro' })).toHaveAttribute('aria-pressed', 'true');
  for (const [width, height] of [
    [320, 568],
    [375, 667],
    [390, 844],
    [844, 390],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [375, 320],
  ]) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByLabel('Contraseña', { exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Mostrar contraseña' }),
    ).toBeFocused();
    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('button', { name: 'Iniciar sesión', exact: true }),
    ).toBeInViewport();
  }
  await page.screenshot({
    path: 'test-results/login-mobile-dark.png',
    fullPage: true,
  });
  await expect(
    page.getByRole('button', { name: 'Iniciar sesión', exact: true }),
  ).toHaveCSS('background-color', 'rgb(213, 244, 84)');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Modo claro' }).click();
  await page.screenshot({
    path: 'test-results/login-desktop-light.png',
    fullPage: true,
  });
});

test('Demo: fallo logout no declara éxito y permite repetir', async ({
  page,
}) => {
  await mocks(page);
  await login(page);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await page.route(
    '**/auth/v1/logout?*',
    (route) =>
      route.fulfill({ status: 500, json: { message: 'Demo unavailable' } }),
    { times: 1 },
  );
  await page
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('No se pudo cerrar');
  await page
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
});

test('Demo: red caída permite reenvío sin duplicación', async ({ page }) => {
  await mocks(page);
  await page.route('**/api/v1/auth/signin', (route) => route.abort('failed'), {
    times: 1,
  });
  await login(page);
  await expect(page.getByRole('alert')).toContainText('conexión');
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click();
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
});

test('Demo: logout en otra pestaña cancela /me pendiente', async ({
  page,
  context,
}) => {
  await mocks(page);
  await login(page);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  const other = await context.newPage();
  await mocks(other);
  await other.goto('/');
  await expect(other.getByText(user.email, { exact: true })).toBeVisible();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/v1/auth/me', async (route) => {
    await pending;
    await route.fulfill({ json: { user } }).catch(() => {});
  });
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Comprobando');
  await other
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  release();
  await expect(
    page.getByRole('heading', { name: 'Iniciar sesión' }),
  ).toBeVisible();
  await expect(page.getByText(user.email, { exact: true })).toHaveCount(0);
});

test('Demo: token vencido se renueva solo mediante SDK Supabase', async ({ page }) => {
  await mocks(page);
  const expired = `${token.split('.')[0]}.${Buffer.from(JSON.stringify({ sub: user.id, exp: 1 })).toString('base64url')}.demo-signature`;
  await page.route('**/api/v1/auth/signin', route => route.fulfill({ json: { user, session: { access_token: expired, refresh_token: 'demo-refresh-fixture' } } }));
  let refreshes = 0;
  await page.route('**/auth/v1/token?grant_type=refresh_token', route => {
    refreshes++;
    return route.fulfill({ json: { access_token: token, refresh_token: 'demo-refresh-renewed', token_type: 'bearer', expires_in: 3600, user } });
  });
  let apiRefreshes = 0;
  page.on('request', request => { if (request.url().includes('/api/v1/auth/refresh')) apiRefreshes++; });
  await login(page);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  expect(refreshes).toBe(1);
  expect(apiRefreshes).toBe(0);
});
