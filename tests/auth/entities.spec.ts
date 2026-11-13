import { expect, test } from '@playwright/test';
import { setup, select, openClient, workspace, entity } from './access.fixture';

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
    page.getByRole('link', { name: 'Ver cliente Cliente Demo, S. A.' }),
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
  await expect(page.getByRole('link', { name: /^Ver cliente / })).toHaveCount(
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
    page.getByRole('main').getByRole('heading', { name: entity.legal_name }),
  ).toBeVisible();
  await expect(
    page.getByRole('main').getByText(entity.taxId, { exact: true }),
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
    page.getByRole('main').getByText('Cambios guardados.'),
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
    page.getByRole('main').getByText('Sin NIT registrado'),
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
    page.getByRole('main').getByText('******001', { exact: true }),
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
    page.getByRole('main').getByText('NIT no disponible'),
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
    await expect(page.getByRole('link', { name: /^Ver cliente / })).toHaveCount(
      0,
    );
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
    await expect(page.getByRole('alert')).toBeVisible();
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
    await expect(page.getByRole('alert')).toBeVisible();
    expect(api.writes).toHaveLength(1);
  });

test('Demo: cambio de espacio elimina la cartera y el NIT del contexto anterior', async ({
  page,
}) => {
  await setup(page, { secondWorkspace: true });
  await select(page);
  await expect(page.getByText(entity.taxId, { exact: true })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Ubicación' })
    .getByRole('link', { name: 'Espacios', exact: true })
    .click();
  await page.getByRole('link', { name: 'Abrir Otro Despacho Demo' }).click();
  await expect(
    page.getByRole('heading', { name: 'Clientes de Otro Despacho Demo' }),
  ).toBeVisible();
  await expect(page.getByText('******001', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(entity.taxId);
});

test('Demo: volver a cartera enfoca contenido y mantiene tamaños móviles sin desbordamiento', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await setup(page);
  await select(page);
  await openClient(page);
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Clientes de Despacho Demo' }),
  ).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
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
    page.getByRole('main').getByText('DEMO-0009', { exact: true }),
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
    .getByRole('navigation', { name: 'Ubicación' })
    .getByRole('link', { name: 'Espacios', exact: true })
    .click();
  await page.getByRole('link', { name: 'Abrir Otro Despacho Demo' }).click();
  await expect(page.getByText('******001', { exact: true })).toBeVisible();
  release();
  await expect(
    page.getByRole('link', { name: 'Ver cliente Cliente Tardío Demo' }),
  ).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(entity.taxId);
});

test('Demo: enlaces directos, recarga y adelante mantienen el contexto', async ({
  page,
}) => {
  await setup(page);
  await select(page);
  await openClient(page);
  const destination = page.url();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: entity.legal_name, exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Clientes de Despacho Demo' }),
  ).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(destination);
  await expect(
    page.getByRole('heading', { name: entity.legal_name, exact: true }),
  ).toBeVisible();
});

test('Demo: enlace inválido no solicita clientes', async ({ page }) => {
  const api = await setup(page);
  const before = api.reads();
  await page.goto('/workspaces/invalido/clients');
  await expect(
    page.getByRole('heading', { name: 'Enlace no disponible' }),
  ).toBeVisible();
  expect(api.reads()).toBe(before);
});

test('Demo: menú móvil cierra con Escape y navega sin dejar el foco detrás', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await setup(page);
  await select(page);
  const trigger = page.getByRole('button', {
    name: 'Abrir menú de navegación',
  });
  const drawer = page.getByRole('dialog', { name: 'Navegación', exact: true });
  await trigger.click();
  await expect(drawer).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(drawer.getByText(workspace.name, { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await drawer.getByRole('link', { name: 'Espacios', exact: true }).click();
  await expect(drawer).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Tus espacios de trabajo' }),
  ).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
});

test('Demo: lateral de escritorio conserva Clientes activo en el detalle', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setup(page);
  await select(page);
  await openClient(page);
  const sidebar = page.getByRole('complementary', {
    name: 'Panel de navegación',
  });
  await expect(sidebar).toBeVisible();
  await expect(
    sidebar.getByText(workspace.name, { exact: true }),
  ).toBeVisible();
  await expect(
    sidebar.getByRole('link', { name: 'Clientes', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    page.getByRole('button', { name: 'Abrir menú de navegación' }),
  ).not.toBeVisible();
  await sidebar.getByRole('link', { name: 'Cambiar espacio' }).click();
  await expect(
    page.getByRole('heading', { name: 'Tus espacios de trabajo' }),
  ).toBeVisible();
  await expect(
    sidebar.getByRole('link', { name: 'Clientes', exact: true }),
  ).toHaveCount(0);
});

test('Demo: ampliar a escritorio cierra el panel móvil y libera el contenido', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await setup(page);
  await page.getByRole('button', { name: 'Abrir menú de navegación' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Navegación', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(
    page.getByRole('dialog', { name: 'Navegación', exact: true }),
  ).not.toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .not.toBe('hidden');
});
