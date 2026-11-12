import { expect, test, type Page } from '@playwright/test';

// Synthetic Demo data only; the application never contains these fixtures.
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'contador@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};
const workspace = {
  id: '22222222-2222-4222-8222-222222222222',
  owner_id: user.id,
  name: 'Despacho Demo',
  slug: 'despacho-demo',
  role: 'owner',
  created_at: user.created_at,
  updated_at: user.created_at,
};
const otherWorkspace = {
  ...workspace,
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Otro Despacho Demo',
  slug: 'otro-demo',
};
const entity = {
  id: '33333333-3333-4333-8333-333333333333',
  kind: 'tax_entity',
  legal_name: 'Cliente Demo, S. A.',
  taxId: 'DEMO-0001',
  created_by: user.id,
  created_at: user.created_at,
  updated_at: user.created_at,
  permissions: {
    canView: true,
    canUpload: true,
    canReview: true,
    canManage: true,
  },
};
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', role: 'authenticated', session_id: 'demo-session', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.demo-signature`;
type Options = {
  empty?: boolean;
  viewer?: boolean;
  listStatus?: number;
  detailStatus?: number;
  writeStatus?: number;
  secondWorkspace?: boolean;
  unexpectedFullTax?: boolean;
};
async function setup(page: Page, options: Options = {}) {
  let current = {
    ...entity,
    taxId:
      options.viewer && !options.unexpectedFullTax ? '******001' : entity.taxId,
    permissions: { ...entity.permissions, canManage: !options.viewer },
  };
  let items = options.empty ? [] : [current];
  const writes: { method: string; body: Record<string, unknown> }[] = [];
  let reads = 0;
  await page.route('https://auth.demo.test/auth/v1/**', (route) =>
    route.request().url().includes('/logout')
      ? route.fulfill({ status: 204 })
      : route.fulfill({ json: user }),
  );
  await page.route('http://api.demo.test/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
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
      return route.fulfill({
        json: {
          profile: {
            id: user.id,
            display_name: 'Contadora Demo',
            avatar_url: null,
            locale: 'es-GT',
            timezone: 'America/Guatemala',
            created_at: user.created_at,
            updated_at: user.created_at,
          },
        },
      });
    if (path === '/api/v1/workspaces')
      return route.fulfill({
        json: {
          workspaces: [
            workspace,
            ...(options.secondWorkspace ? [otherWorkspace] : []),
          ].map((item) => ({
            ...item,
            role: options.viewer ? 'viewer' : 'owner',
          })),
        },
      });
    if (
      path === `/api/v1/workspaces/${workspace.id}` ||
      path === `/api/v1/workspaces/${otherWorkspace.id}`
    )
      return route.fulfill({
        json: {
          workspace: path.endsWith(otherWorkspace.id)
            ? otherWorkspace
            : workspace,
          role: options.viewer ? 'viewer' : 'owner',
        },
      });
    const base = `/api/v1/workspaces/${workspace.id}/entities`;
    if (path === `/api/v1/workspaces/${otherWorkspace.id}/entities`) {
      reads++;
      return route.fulfill({
        json: {
          entities: [
            {
              ...entity,
              taxId: '******001',
              permissions: { ...entity.permissions, canManage: false },
            },
          ],
        },
      });
    }
    if (path === base && method === 'GET') {
      reads++;
      return options.listStatus
        ? route.fulfill({
            status: options.listStatus,
            json: { error: 'DEMO_ERROR' },
          })
        : route.fulfill({ json: { entities: items } });
    }
    if (path === `${base}/${entity.id}` && method === 'GET')
      return options.detailStatus
        ? route.fulfill({
            status: options.detailStatus,
            json: { error: 'ENTITY_NOT_FOUND' },
          })
        : route.fulfill({ json: { entity: current } });
    if (
      (path === base && method === 'POST') ||
      (path === `${base}/${entity.id}` && method === 'PATCH')
    ) {
      const body = route.request().postDataJSON();
      expect(
        Object.keys(body).every((key) => ['legalName', 'taxId'].includes(key)),
      ).toBe(true);
      writes.push({ method, body });
      if (options.writeStatus)
        return route.fulfill({
          status: options.writeStatus,
          json: { error: 'ENTITY_CONFLICT' },
        });
      current = {
        ...current,
        legal_name: body.legalName ?? current.legal_name,
      };
      if ('taxId' in body) current.taxId = body.taxId;
      if (method === 'POST') current.taxId = body.taxId;
      items = [current];
      return route.fulfill({
        status: method === 'POST' ? 201 : 200,
        json: { entity: current },
      });
    }
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
  return { writes, reads: () => reads };
}
async function select(page: Page) {
  await page.getByRole('button', { name: 'Seleccionar Despacho Demo' }).click();
  await expect(
    page.getByRole('heading', { name: 'Clientes de Despacho Demo' }),
  ).toBeVisible();
}
async function openClient(page: Page) {
  await page
    .getByRole('button', { name: 'Ver cliente Cliente Demo, S. A.' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Detalle del cliente' }),
  ).toBeVisible();
}

test('Demo: no consulta clientes sin espacio confirmado y carga lista contextual', async ({
  page,
}) => {
  const api = await setup(page);
  expect(api.reads()).toBe(0);
  await expect(page.getByRole('heading', { name: /Clientes de/ })).toHaveCount(
    0,
  );
  await select(page);
  await expect(
    page.getByRole('button', { name: 'Ver cliente Cliente Demo, S. A.' }),
  ).toBeVisible();
  expect(api.reads()).toBe(1);
});

test('Demo: cartera vacía permite crear sin inventar clientes', async ({
  page,
}) => {
  await setup(page, { empty: true });
  await select(page);
  await expect(
    page.getByRole('heading', { name: 'Aún no hay clientes en este espacio.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Ver cliente / })).toHaveCount(
    0,
  );
});

test('Demo: creación normaliza NIT, restringe body y muestra confirmación', async ({
  page,
}) => {
  const api = await setup(page, { empty: true });
  await select(page);
  await page
    .getByRole('button', { name: 'Crear cliente', exact: true })
    .click();
  await page.getByLabel('Nombre legal del cliente').fill('Nuevo Cliente Demo');
  await page
    .getByLabel('NIT (opcional)', { exact: true })
    .fill(' demo - 0002 ');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Crear cliente', exact: true })
    .click();
  await expect(
    page.getByText('Se creó «Nuevo Cliente Demo» correctamente.'),
  ).toBeVisible();
  expect(api.writes).toEqual([
    {
      method: 'POST',
      body: { legalName: 'Nuevo Cliente Demo', taxId: 'DEMO-0002' },
    },
  ]);
});

test('Demo: NIT opcional vacío se omite del POST', async ({ page }) => {
  const api = await setup(page, { empty: true });
  await select(page);
  await page
    .getByRole('button', { name: 'Crear cliente', exact: true })
    .click();
  await page
    .getByLabel('Nombre legal del cliente')
    .fill('Cliente Sin NIT Demo');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Crear cliente', exact: true })
    .click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(api.writes[0]?.body).toEqual({ legalName: 'Cliente Sin NIT Demo' });
});

test('Demo: validación bloquea nombre corto y NIT con formato inválido', async ({
  page,
}) => {
  const api = await setup(page);
  await select(page);
  await page
    .getByRole('button', { name: 'Crear cliente', exact: true })
    .click();
  await page.getByLabel('Nombre legal del cliente').fill('X');
  await page.getByLabel('NIT (opcional)', { exact: true }).fill('**/**');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Crear cliente', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'Revisa los siguientes datos',
  );
  expect(api.writes).toHaveLength(0);
});

test('Demo: detalle muestra datos y permite editar solo con canManage', async ({
  page,
}) => {
  await setup(page);
  await select(page);
  await openClient(page);
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: entity.legal_name }),
  ).toBeVisible();
  await expect(
    page.getByRole('dialog').getByText(entity.taxId, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Editar cliente', exact: true }),
  ).toBeVisible();
});

test('Demo: cambio solo de nombre no envía ni borra NIT', async ({ page }) => {
  const api = await setup(page);
  await select(page);
  await openClient(page);
  await page
    .getByRole('button', { name: 'Editar cliente', exact: true })
    .click();
  await page
    .getByLabel('Nombre legal del cliente')
    .fill('Cliente Actualizado Demo');
  await page
    .getByRole('button', { name: 'Guardar cambios', exact: true })
    .click();
  await expect(
    page.getByRole('dialog').getByText('Cambios guardados.'),
  ).toBeVisible();
  expect(api.writes[0]).toEqual({
    method: 'PATCH',
    body: { legalName: 'Cliente Actualizado Demo' },
  });
});

test('Demo: quitar NIT requiere acción explícita y envía null', async ({
  page,
}) => {
  const api = await setup(page);
  await select(page);
  await openClient(page);
  await page
    .getByRole('button', { name: 'Editar cliente', exact: true })
    .click();
  await page.getByLabel('Acción sobre el NIT').selectOption('remove');
  await page
    .getByRole('button', { name: 'Guardar cambios', exact: true })
    .click();
  await expect(
    page.getByRole('dialog').getByText('Sin NIT registrado'),
  ).toBeVisible();
  expect(api.writes[0]?.body).toEqual({ taxId: null });
});

test('Demo: permisos de consulta respetan máscara y no ofrecen edición ni creación', async ({
  page,
}) => {
  await setup(page, { viewer: true });
  await select(page);
  await openClient(page);
  await expect(
    page.getByRole('dialog').getByText('******001', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Editar cliente', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Crear cliente', exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(entity.taxId);
});

test('Demo: descarta NIT completo inesperado cuando canManage es falso', async ({
  page,
}) => {
  await setup(page, { viewer: true, unexpectedFullTax: true });
  await select(page);
  await openClient(page);
  await expect(
    page.getByRole('dialog').getByText('NIT no disponible'),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText(entity.taxId);
});

for (const status of [401, 403, 404, 409, 503])
  test(`Demo: listado ${status} muestra error seguro y reintento o reautenticación`, async ({
    page,
  }) => {
    await setup(page, { listStatus: status });
    await select(page);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Ver cliente / }),
    ).toHaveCount(0);
    if (status === 401)
      await expect(
        page.getByRole('button', { name: 'Volver a iniciar sesión' }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole('button', { name: 'Reintentar clientes' }),
      ).toBeVisible();
  });

for (const status of [403, 404])
  test(`Demo: detalle ${status} no muestra información almacenada como válida`, async ({
    page,
  }) => {
    await setup(page, { detailStatus: status });
    await select(page);
    await openClient(page);
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Editar cliente', exact: true }),
    ).toHaveCount(0);
  });

for (const status of [409, 503])
  test(`Demo: creación ${status} conserva formulario sin reintentar escritura`, async ({
    page,
  }) => {
    const api = await setup(page, { writeStatus: status });
    await select(page);
    await page
      .getByRole('button', { name: 'Crear cliente', exact: true })
      .click();
    await page
      .getByLabel('Nombre legal del cliente')
      .fill('Cliente Error Demo');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Crear cliente', exact: true })
      .click();
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
    expect(api.writes).toHaveLength(1);
  });

test('Demo: cambio de espacio elimina la cartera y el NIT del contexto anterior', async ({
  page,
}) => {
  await setup(page, { secondWorkspace: true });
  await select(page);
  await expect(page.getByText(entity.taxId, { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Seleccionar Otro Despacho Demo' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Clientes de Otro Despacho Demo' }),
  ).toBeVisible();
  await expect(page.getByText('******001', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(entity.taxId);
});

test('Demo: diálogo restaura foco y mantiene tamaños móviles sin desbordamiento', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await setup(page);
  await select(page);
  await openClient(page);
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Ver cliente Cliente Demo, S. A.' }),
  ).toBeFocused();
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test('Demo: cambiar NIT envía solo el valor normalizado autorizado', async ({
  page,
}) => {
  const api = await setup(page);
  await select(page);
  await openClient(page);
  await page
    .getByRole('button', { name: 'Editar cliente', exact: true })
    .click();
  await page.getByLabel('Acción sobre el NIT').selectOption('replace');
  await page.getByLabel('Nuevo NIT', { exact: true }).fill(' demo - 0009 ');
  await page
    .getByRole('button', { name: 'Guardar cambios', exact: true })
    .click();
  await expect(
    page.getByRole('dialog').getByText('DEMO-0009', { exact: true }),
  ).toBeVisible();
  expect(api.writes[0]?.body).toEqual({ taxId: 'DEMO-0009' });
});

test('Demo: creación pendiente impide doble envío y cierre accidental', async ({
  page,
}) => {
  await setup(page, { empty: true });
  await select(page);
  let calls = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/workspaces/${workspace.id}/entities`, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    calls++;
    await pending;
    await route.fulfill({ status: 201, json: { entity } });
  });
  await page
    .getByRole('button', { name: 'Crear cliente', exact: true })
    .click();
  await page.getByLabel('Nombre legal del cliente').fill('Cliente Demo, S. A.');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Crear cliente', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByRole('dialog')
    .locator('form')
    .evaluate((element) => (element as HTMLFormElement).requestSubmit());
  release();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(calls).toBe(1);
});

test('Demo: respuesta tardía de otro espacio no repuebla la cartera visible', async ({
  page,
}) => {
  await setup(page, { secondWorkspace: true });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/workspaces/${workspace.id}/entities`, async (route) => {
    await pending;
    await route
      .fulfill({
        json: { entities: [{ ...entity, legal_name: 'Cliente Tardío Demo' }] },
      })
      .catch(() => {});
  });
  await select(page);
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Cargando clientes de Despacho Demo' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Seleccionar Otro Despacho Demo' })
    .click();
  await expect(page.getByText('******001', { exact: true })).toBeVisible();
  release();
  await expect(
    page.getByRole('button', { name: 'Ver cliente Cliente Tardío Demo' }),
  ).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(entity.taxId);
});
