import { expect, test } from '@playwright/test';
import {
  setup,
  select,
  openClient,
  workspace,
  entity,
  user,
} from './access.fixture';

const basePath = `/workspaces/${workspace.id}/clients/${entity.id}`;
const apiBase = `http://api.demo.test/api/v1/workspaces/${workspace.id}/entities/${entity.id}`;

test('Demo: el submenú conserva la entidad en URL, recarga e historial', async ({
  page,
}) => {
  await setup(page);
  await select(page);
  await openClient(page);
  await page.route(`${apiBase}/memberships`, (route) =>
    route.fulfill({ json: { memberships: [] } }),
  );
  const navigation = page.getByRole('navigation', {
    name: 'Secciones del cliente',
  });
  await navigation.getByRole('link', { name: 'Personas y accesos' }).click();
  await expect(page).toHaveURL(basePath + '/people');
  await expect(
    page.getByRole('heading', { name: entity.legal_name, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Todavía no hay personas con acceso' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    navigation.getByRole('link', { name: 'Personas y accesos' }),
  ).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page).toHaveURL(basePath);
  await expect(
    navigation.getByRole('link', { name: 'Datos del cliente' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('Demo: cambiar de sección pide descartar y conservar mantiene el borrador', async ({
  page,
}) => {
  await setup(page);
  await select(page);
  await openClient(page);
  await page
    .getByRole('button', { name: 'Editar cliente', exact: true })
    .click();
  await page
    .getByLabel('Nombre legal del cliente')
    .fill('Cliente Borrador Demo');
  const navigation = page.getByRole('navigation', {
    name: 'Secciones del cliente',
  });
  await navigation
    .getByRole('link', { name: 'Invitaciones', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: '¿Descartar los cambios?' });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(basePath);
  await dialog.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page.getByLabel('Nombre legal del cliente')).toHaveValue(
    'Cliente Borrador Demo',
  );
  await navigation
    .getByRole('link', { name: 'Invitaciones', exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Descartar y continuar' }).click();
  await expect(page).toHaveURL(basePath + '/invitations');
  await expect(page.getByLabel('Nombre legal del cliente')).toHaveCount(0);
});

test('Demo: Atrás protege los cambios y cancelar conserva la ruta actual', async ({
  page,
}) => {
  await setup(page);
  await select(page);
  await openClient(page);
  await page
    .getByRole('button', { name: 'Editar cliente', exact: true })
    .click();
  await page
    .getByLabel('Nombre legal del cliente')
    .fill('Cliente Otro Borrador Demo');
  await page.goBack();
  const dialog = page.getByRole('dialog', { name: '¿Descartar los cambios?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page).toHaveURL(basePath);
  await expect(page.getByLabel('Nombre legal del cliente')).toHaveValue(
    'Cliente Otro Borrador Demo',
  );
});

test('Demo: un viewer no consulta personas al abrir una subsección directa', async ({
  page,
}) => {
  await setup(page, { viewer: true });
  let reads = 0;
  await page.route(`${apiBase}/memberships`, (route) => {
    reads++;
    return route.fulfill({ status: 403 });
  });
  await page.goto(basePath + '/people');
  await expect(
    page.getByRole('heading', {
      name: 'No tienes permisos para administrar accesos',
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Secciones del cliente' })
      .getByRole('link', { name: 'Invitaciones' }),
  ).toHaveCount(0);
  expect(reads).toBe(0);
});

test('Demo: varias personas se buscan y filtran dentro de la misma entidad', async ({
  page,
}) => {
  await setup(page);
  const profiles = [
    {
      id: '66666666-6666-4666-8666-666666666666',
      userId: user.id,
      name: 'Colaborador Uno Demo',
      status: 'active',
    },
    {
      id: '77777777-7777-4777-8777-777777777777',
      userId: '88888888-8888-4888-8888-888888888888',
      name: 'Colaborador Dos Demo',
      status: 'active',
    },
    {
      id: '99999999-9999-4999-8999-999999999999',
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Colaborador Revocado Demo',
      status: 'revoked',
    },
  ];
  const requests: string[] = [];
  await page.route('**/memberships', (route) => {
    requests.push(route.request().url());
    return route.fulfill({
      json: {
        memberships: profiles.map((person) => ({
          id: person.id,
          user_id: person.userId,
          workspace_id: workspace.id,
          entity_id: entity.id,
          role: 'client_contributor',
          status: person.status,
          joined_at: user.created_at,
          revoked_at: person.status === 'revoked' ? user.created_at : null,
          user: {
            id: person.userId,
            display_name: person.name,
            avatar_url: null,
          },
        })),
      },
    });
  });
  await select(page);
  await openClient(page);
  await page
    .getByRole('navigation', { name: 'Secciones del cliente' })
    .getByRole('link', { name: 'Personas y accesos' })
    .click();
  await expect(
    page.getByText('Colaborador Uno Demo', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Colaborador Dos Demo', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Colaborador Revocado Demo', { exact: true }),
  ).toHaveCount(0);
  await page.getByLabel('Buscar personas por nombre o rol').fill('Dos');
  await expect(
    page.getByText('Colaborador Uno Demo', { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Limpiar búsqueda de personas' })
    .click();
  await page.getByLabel('Filtrar personas por estado').selectOption('revoked');
  await expect(
    page.getByText('Colaborador Revocado Demo', { exact: true }),
  ).toBeVisible();
  expect(requests).toEqual([apiBase + '/memberships']);
});
