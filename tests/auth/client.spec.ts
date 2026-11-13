import { test, expect, type Page } from '@playwright/test';
import { setup, workspace, entity } from './access.fixture';
const demoToken = 'demoIsolatedClientToken_NotARealToken_12345';
const membershipId = '77777777-7777-4777-8777-777777777777';
const path = `/client/entities/${entity.id}?workspaceId=${workspace.id}`;
async function clientFixture(page: Page, status = 200) {
  await setup(page);
  await expect(
    page.getByRole('link', { name: 'Abrir Despacho Demo' }),
  ).toBeVisible();
  let workspaceReads = 0;
  let writes = 0;
  let entityReads = 0;
  await page.route('http://api.demo.test/api/v1/**', (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== 'GET' && !url.pathname.endsWith('/accept'))
      writes++;
    if (/\/workspaces(?:\/[^/]+)?$/.test(url.pathname)) {
      workspaceReads++;
      return route.fulfill({
        status: 404,
        json: { error: 'WORKSPACE_NOT_FOUND' },
      });
    }
    if (url.pathname === '/api/v1/profile/entities') {
      entityReads++;
      return route.fulfill({
        status,
        json:
          status === 200
            ? {
                entity_memberships: [
                  {
                    workspace_id: workspace.id,
                    entity_id: entity.id,
                    role: 'client_viewer',
                    entity: {
                      id: entity.id,
                      kind: 'tax_entity',
                      legal_name: entity.legal_name,
                      taxId: '******001',
                      permissions: {
                        can_view: true,
                        can_upload: true,
                        can_review: false,
                        can_manage: false,
                      },
                    },
                  },
                ],
              }
            : { error: 'ENTITY_NOT_FOUND' },
      });
    }
    if (
      url.pathname ===
      `/api/v1/workspaces/${workspace.id}/entities/${entity.id}`
    ) {
      entityReads++;
      return route.fulfill({
        status,
        json:
          status === 200
            ? {
                entity: {
                  ...entity,
                  taxId: '******001',
                  permissions: { ...entity.permissions, canManage: false },
                },
              }
            : { error: 'ENTITY_NOT_FOUND' },
      });
    }
    if (url.pathname === `/api/v1/invitations/${demoToken}`)
      return route.fulfill({
        json: {
          invitation: {
            status: 'pending',
            expiresAt: '2099-12-31T00:00:00Z',
            workspaceId: workspace.id,
            entityId: entity.id,
            role: 'client_viewer',
          },
        },
      });
    if (url.pathname === `/api/v1/invitations/${demoToken}/accept`)
      return route.fulfill({
        json: {
          membership: {
            membershipId,
            workspaceId: workspace.id,
            entityId: entity.id,
            role: 'client_viewer',
          },
        },
      });
    return route.fallback();
  });
  return {
    workspaceReads: () => workspaceReads,
    writes: () => writes,
    entityReads: () => entityReads,
  };
}
test('Demo: aceptar abre cliente aislado sin consultar ni crear workspace membership', async ({
  page,
}) => {
  const calls = await clientFixture(page);
  await page.goto(`/invitations/accept?token=${demoToken}`);
  await page.getByRole('button', { name: 'Aceptar invitación' }).click();
  await expect(page).toHaveURL(
    new RegExp(`/client/entities/${entity.id}\\?workspaceId=${workspace.id}$`),
  );
  await expect(
    page.getByRole('heading', { name: entity.legal_name, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText('Consulta autorizada', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' }),
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Crear espacio' })).toHaveCount(
    0,
  );
  await expect(
    page.getByText('Este espacio seguirá creciendo'),
  ).toBeVisible();
  expect(calls.workspaceReads()).toBe(0);
  expect(calls.writes()).toBe(0);
});
test('Demo: bloqueo actual del endpoint de entity se muestra sin otorgar acceso', async ({
  page,
}) => {
  const calls = await clientFixture(page, 404);
  await page.goto(`/invitations/accept?token=${demoToken}`);
  await page.getByRole('button', { name: 'Aceptar invitación' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'La empresa no está disponible para esta cuenta',
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Consulta autorizada', { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(entity.legal_name);
  await expect(page.locator('body')).not.toContainText('WORKSPACE_NOT_FOUND');
  expect(calls.workspaceReads()).toBe(0);
});
for (const status of [401, 403, 404, 503])
  test(`Demo: cliente ${status} sin datos ni privilegios anteriores`, async ({
    page,
  }) => {
    const calls = await clientFixture(page, status);
    await page.goto(path);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Editar cliente' }),
    ).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(entity.taxId);
    expect(calls.workspaceReads()).toBe(0);
  });
test('Demo: recarga aislada revalida entity y no usa rol de URL ni lista de workspaces', async ({
  page,
}) => {
  const calls = await clientFixture(page);
  await page.goto(path);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: entity.legal_name, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText('Consulta autorizada', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Mi cuenta', exact: true }),
  ).toHaveCount(0);
  expect(calls.workspaceReads()).toBe(0);
});
test('Demo: contexto inválido no hace consultas y sesión anónima conserva destino seguro', async ({
  page,
}) => {
  const calls = await clientFixture(page);
  await page.goto(`/client/entities/invalida?workspaceId=${workspace.id}`);
  await expect(
    page.getByRole('heading', { name: 'Enlace de acceso incompleto' }),
  ).toBeVisible();
  expect(calls.entityReads()).toBe(0);
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
  await expect(
    page.getByRole('heading', { name: 'Iniciar sesión' }),
  ).toBeVisible();
  expect(calls.workspaceReads()).toBe(0);
});
test('Demo: logout elimina el contexto de aceptación y nunca concede membresía de despacho', async ({
  page,
}) => {
  const calls = await clientFixture(page);
  await page.goto(`/invitations/accept?token=${demoToken}`);
  await page.getByRole('button', { name: 'Aceptar invitación' }).click();
  await expect(
    page.getByText('Consulta autorizada', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Opciones de cuenta' }).click();
  await page
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Iniciar sesión' }),
  ).toBeVisible();
  const cached = await page.evaluate(async () => {
    const modulePath = '/src/shared/api/queryClient.ts';
    const { queryClient } = await import(/* @vite-ignore */ modulePath);
    return queryClient
      .getQueryCache()
      .getAll()
      .filter((q: { queryKey: string[] }) => q.queryKey[0] === 'client-entity')
      .length;
  });
  expect(cached).toBe(0);
  expect(calls.writes()).toBe(0);
});
