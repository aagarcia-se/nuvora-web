import { expect, type Page } from '@playwright/test';

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
    if (path === `${base}/${entity.id}/memberships`)
      return route.fulfill({ json: { memberships: [] } });
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
  await page.getByRole('link', { name: 'Abrir Despacho Demo' }).click();
  await expect(
    page.getByRole('heading', { name: 'Clientes de Despacho Demo' }),
  ).toBeVisible();
}
async function openClient(page: Page) {
  await page
    .getByRole('link', { name: 'Ver cliente Cliente Demo, S. A.' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Detalle del cliente', exact: true }),
  ).toBeVisible();
}

export { setup, select, openClient, workspace, entity, user };
