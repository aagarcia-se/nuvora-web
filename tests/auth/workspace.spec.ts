import { expect, test, type Page } from '@playwright/test';

// Synthetic Demo identities; all traffic remains intercepted in the isolated server.
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'contador@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', role: 'authenticated', session_id: 'demo-session', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.demo-signature`;
const workspace = {
  id: '22222222-2222-4222-8222-222222222222',
  owner_id: user.id,
  name: 'Despacho Demo',
  slug: 'despacho-demo',
  role: 'owner',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};
const profile = {
  id: user.id,
  display_name: 'Contadora Demo',
  avatar_url: null,
  locale: 'es-GT',
  timezone: 'America/Guatemala',
  created_at: user.created_at,
  updated_at: user.created_at,
};

async function setup(
  page: Page,
  options: {
    empty?: boolean;
    noName?: boolean;
    profileStatus?: number;
    listStatus?: number;
    createStatus?: number;
    detailStatus?: number;
  } = {},
) {
  let items = options.empty ? [] : [workspace];
  let creations = 0;
  await page.route('https://auth.demo.test/auth/v1/**', (route) =>
    route.request().url().includes('/logout')
      ? route.fulfill({ status: 204 })
      : route.fulfill({ json: user }),
  );
  await page.route('http://api.demo.test/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/signin')
      return route.fulfill({
        json: {
          user,
          session: { access_token: token, refresh_token: 'demo-refresh' },
        },
      });
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`);
    if (path === '/api/v1/auth/me') return route.fulfill({ json: { user } });
    if (path === '/api/v1/profile')
      return options.profileStatus
        ? route.fulfill({
            status: options.profileStatus,
            json: {
              error:
                options.profileStatus === 404
                  ? 'PROFILE_NOT_FOUND'
                  : 'PROFILE_PROVIDER_ERROR',
            },
          })
        : route.fulfill({
            json: {
              profile: {
                ...profile,
                display_name: options.noName ? null : profile.display_name,
              },
            },
          });
    if (path === '/api/v1/workspaces' && route.request().method() === 'GET')
      return options.listStatus
        ? route.fulfill({
            status: options.listStatus,
            json: { error: 'DEMO_ERROR' },
          })
        : route.fulfill({ json: { workspaces: items } });
    if (path === '/api/v1/workspaces' && route.request().method() === 'POST') {
      creations++;
      expect(Object.keys(route.request().postDataJSON()).sort()).toEqual([
        'name',
        'slug',
      ]);
      if (options.createStatus)
        return route.fulfill({
          status: options.createStatus,
          json: { error: 'WORKSPACE_SLUG_CONFLICT' },
        });
      const { name, slug } = route.request().postDataJSON();
      const created = { ...workspace, name, slug };
      items = [created];
      return route.fulfill({ status: 201, json: { workspace: created } });
    }
    if (path === `/api/v1/workspaces/${workspace.id}`)
      return options.detailStatus
        ? route.fulfill({
            status: options.detailStatus,
            json: { error: 'WORKSPACE_NOT_FOUND' },
          })
        : route.fulfill({
            json: { workspace: items[0] ?? workspace, role: 'owner' },
          });
    if (path.endsWith('/entities'))
      return route.fulfill({ json: { entities: [] } });
    return route.fulfill({ status: 404, json: { error: 'DEMO_NOT_FOUND' } });
  });
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Demo-password1!');
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Tus espacios de trabajo' }),
  ).toBeVisible();
  return { creations: () => creations };
}

async function openCreate(page: Page) {
  await page
    .getByRole('button', { name: 'Crear espacio', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('Demo: perfil y lista autenticados sin reutilizar el contenedor de login', async ({
  page,
}) => {
  await setup(page);
  await expect(
    page
      .getByRole('complementary', { name: 'Tu perfil' })
      .getByRole('heading', { name: 'Contadora Demo' }),
  ).toBeVisible();
  await expect(page.getByText('Español · Guatemala')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Seleccionar Despacho Demo' }),
  ).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('.auth-form')).toHaveCount(0);
});

test('Demo: perfil sin nombre ni avatar tiene presentación alternativa', async ({
  page,
}) => {
  await setup(page, { noName: true });
  const card = page.getByRole('complementary', { name: 'Tu perfil' });
  await expect(card.getByRole('heading', { name: 'Tu cuenta' })).toBeVisible();
  await expect(card.getByText(user.email, { exact: true })).toBeVisible();
});

test('Demo: perfil 404 no bloquea espacios disponibles', async ({ page }) => {
  await setup(page, { profileStatus: 404 });
  await expect(
    page.getByText(
      'Tu perfil todavía no está disponible. Puedes continuar con tu cuenta.',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Seleccionar Despacho Demo' }),
  ).toBeVisible();
});

test('Demo: lista vacía muestra creación y no datos ficticios', async ({
  page,
}) => {
  await setup(page, { empty: true });
  await expect(
    page.getByRole('heading', { name: 'Todo empieza con un espacio.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Seleccionar / })).toHaveCount(
    0,
  );
});

test('Demo: creación única, confirmación y detalle autorizado', async ({
  page,
}) => {
  const api = await setup(page, { empty: true });
  await openCreate(page);
  await page
    .getByLabel('Nombre del espacio', { exact: true })
    .fill('Equipo Demo');
  await expect(page.getByLabel('Identificador', { exact: true })).toHaveValue(
    'equipo-demo',
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Crear espacio', exact: true })
    .click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByText('Se creó «Equipo Demo» correctamente.'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Tu contexto de trabajo' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Equipo Demo', exact: true }),
  ).toBeVisible();
  expect(api.creations()).toBe(1);
});

test('Demo: validación impide enviar nombre e identificador inválidos', async ({
  page,
}) => {
  const api = await setup(page);
  await openCreate(page);
  await page.getByLabel('Nombre del espacio', { exact: true }).fill('A');
  await page.getByLabel('Identificador', { exact: true }).fill('demo--espacio');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Crear espacio', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'Revisa los siguientes datos',
  );
  expect(api.creations()).toBe(0);
});

test('Demo: identificador duplicado no reintenta ni cierra diálogo', async ({
  page,
}) => {
  const api = await setup(page, { createStatus: 409 });
  await openCreate(page);
  await page
    .getByLabel('Nombre del espacio', { exact: true })
    .fill('Espacio Demo');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Crear espacio', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'Este identificador ya está en uso',
  );
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(api.creations()).toBe(1);
});

for (const status of [401, 403, 503])
  test(`Demo: lista ${status} informa sin mostrar datos anteriores`, async ({
    page,
  }) => {
    await setup(page, { listStatus: status });
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Seleccionar / }),
    ).toHaveCount(0);
    if (status === 401)
      await expect(
        page.getByRole('button', { name: 'Volver a iniciar sesión' }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole('button', { name: 'Reintentar', exact: true }),
      ).toBeVisible();
  });

test('Demo: perfil 503 permite continuar y reintentar su consulta', async ({
  page,
}) => {
  await setup(page, { profileStatus: 503 });
  await expect(
    page.getByRole('complementary', { name: 'Tu perfil' }).getByRole('alert'),
  ).toContainText('El servicio no está disponible');
  await expect(
    page.getByRole('button', { name: 'Seleccionar Despacho Demo' }),
  ).toBeVisible();
});

test('Demo: detalle 404 no presenta selección como acceso confirmado', async ({
  page,
}) => {
  await setup(page, { detailStatus: 404 });
  await page.getByRole('button', { name: 'Seleccionar Despacho Demo' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Este espacio ya no está disponible',
  );
  await expect(
    page.getByText('Espacio seleccionado para esta sesión.'),
  ).toHaveCount(0);
});

test('Demo: diálogo y cuenta admiten Escape y restauran el foco', async ({
  page,
}) => {
  await setup(page);
  await openCreate(page);
  await expect(
    page.getByLabel('Nombre del espacio', { exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Crear espacio', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Opciones de cuenta' }).click();
  await expect(
    page.getByRole('button', { name: 'Cerrar sesión', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Opciones de cuenta' }),
  ).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Cerrar sesión', exact: true }),
  ).not.toBeVisible();
});

test('Demo: distribución móvil, escritorio y tema oscuro sin desbordamiento', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await setup(page);
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole('heading', { name: 'Tus espacios de trabajo' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await openCreate(page);
  await page.setViewportSize({ width: 320, height: 568 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('Demo: dos envíos durante creación pendiente producen una sola solicitud', async ({
  page,
}) => {
  await setup(page, { empty: true });
  let calls = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/v1/workspaces', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    calls++;
    await pending;
    await route.fulfill({ status: 201, json: { workspace } });
  });
  await openCreate(page);
  await page
    .getByLabel('Nombre del espacio', { exact: true })
    .fill('Despacho Demo');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Crear espacio', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Creando espacio…' }),
  ).toBeDisabled();
  await page
    .getByRole('dialog')
    .locator('form')
    .evaluate((element) => (element as HTMLFormElement).requestSubmit());
  release();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(calls).toBe(1);
});

test('Demo: logout en otra pestaña invalida una creación pendiente', async ({
  page,
  context,
}) => {
  await setup(page, { empty: true });
  const other = await context.newPage();
  await setup(other, { empty: true });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/v1/workspaces', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await pending;
    await route.fulfill({ status: 201, json: { workspace } }).catch(() => {});
  });
  await openCreate(page);
  await page
    .getByLabel('Nombre del espacio', { exact: true })
    .fill('Despacho Demo');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Crear espacio', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Creando espacio…' }),
  ).toBeDisabled();
  await other.getByRole('button', { name: 'Opciones de cuenta' }).click();
  await other
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  release();
  await expect(
    page.getByRole('heading', { name: 'Tus espacios de trabajo' }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Se creó «Despacho Demo» correctamente.'),
  ).toHaveCount(0);
});
