import { test, expect, type Page } from '@playwright/test';
import { setup, entity, workspace } from './access.fixture';

// Synthetic Demo contracts, prepared only. Playwright execution requires authorization.
const clientPath = `/client/entities/${entity.id}?workspaceId=${workspace.id}`;
const counterPath = `/workspaces/${workspace.id}/clients/${entity.id}/documents`;
async function fixture(
  page: Page,
  options: {
    uncertainPut?: boolean;
    summaryStatus?: number;
    viewer?: boolean;
    legacyStatuses?: boolean;
  } = {},
) {
  await setup(page, { viewer: options.viewer });
  const calls = {
    reads: [] as string[],
    puts: [] as Record<string, unknown>[],
  };
  let initial = '100.00';
  await page.route('http://api.demo.test/api/v1/**', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/profile/entities')
      return route.fulfill({
        json: {
          entity_memberships: [
            {
              workspace_id: workspace.id,
              entity_id: entity.id,
              role: 'client_viewer',
              entity: {
                id: entity.id,
                kind: 'tax_entity',
                legal_name: entity.legal_name,
                permissions: {
                  can_view: true,
                  can_upload: false,
                  can_review: false,
                  can_manage: false,
                },
              },
            },
          ],
        },
      });
    const prefix = `/api/v1/workspaces/${workspace.id}/entities/${entity.id}/purchase-periods/`;
    if (!url.pathname.startsWith(prefix)) return route.fallback();
    const period = url.pathname.slice(prefix.length).split('/')[0];
    const summary = () => ({
      period,
      currency: 'GTQ',
      initial_amount: initial,
      purchases_total: period === '2026-11' ? '123.45' : '0.00',
      remaining_amount:
        period !== '2026-11'
          ? initial
          : initial === '200.00'
            ? '76.55'
            : initial === '0.00'
              ? '-123.45'
              : '-23.45',
      purchase_count: period === '2026-11' ? 1 : 0,
      included_statuses: options.legacyStatuses
        ? ['draft', 'needs_correction', 'pending_review', 'approved']
        : ['approved'],
    });
    if (request.method() === 'GET') {
      calls.reads.push(period);
      if (options.summaryStatus)
        return route.fulfill({
          status: options.summaryStatus,
          json: { error: 'DEMO_PERIOD_ERROR' },
        });
      return route.fulfill({ json: { summary: summary() } });
    }
    if (request.method() === 'PUT') {
      const body = request.postDataJSON();
      calls.puts.push(body);
      initial = body.initialAmount;
      if (options.uncertainPut && calls.puts.length === 1)
        return route.fulfill({
          status: 503,
          json: { error: 'DEMO_UNCERTAIN_SAVE' },
        });
      return route.fulfill({ json: { summary: summary() } });
    }
    return route.fallback();
  });
  return calls;
}

test('Demo: resumen de cliente muestra negativo y no ofrece editar', async ({
  page,
}) => {
  const calls = await fixture(page);
  await page.goto(`${clientPath}&view=summary&period=2026-11`);
  await expect(
    page.getByRole('heading', { name: 'Resumen mensual', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('−Q 23.45', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Total de compras aprobadas', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Comprobantes aprobados', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/El total de compras aprobadas supera/),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Configurar monto' }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Ver comprobantes del mes' }).click();
  await expect(page).toHaveURL(`${clientPath}&view=documents&period=2026-11`);
  expect(calls.puts).toHaveLength(0);
});

test('Demo: cabecera de la entidad abre resumen con contexto del despacho', async ({
  page,
}) => {
  await fixture(page);
  await page.goto(`/workspaces/${workspace.id}/clients/${entity.id}`);
  await page
    .getByRole('link', { name: 'Ver resumen mensual', exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(
      `/workspaces/${workspace.id}/clients/${entity.id}/documents\\?view=summary&period=\\d{4}-\\d{2}$`,
    ),
  );
  await expect(
    page.getByRole('heading', { name: entity.legal_name, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText(`Cliente de ${workspace.name}`, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Resumen mensual', level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Configurar monto' }),
  ).toBeVisible();
});

test('Demo: owner con canView sin canManage consulta sin configurar el monto', async ({
  page,
}) => {
  const calls = await fixture(page);
  await page.route(
    `http://api.demo.test/api/v1/workspaces/${workspace.id}/entities/${entity.id}`,
    (route) =>
      route.fulfill({
        json: {
          entity: {
            ...entity,
            taxId: '******001',
            permissions: {
              ...entity.permissions,
              canManage: false,
              canReview: false,
            },
          },
        },
      }),
  );
  await page.goto(`${counterPath}?view=summary&period=2026-11`);
  await expect(page.getByText('−Q 23.45', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Configurar monto' }),
  ).toHaveCount(0);
  expect(calls.puts).toHaveLength(0);
});

test('Demo: viewer del workspace no monta la consulta mensual por enlace directo', async ({
  page,
}) => {
  const calls = await fixture(page, { viewer: true });
  await page.goto(`${counterPath}?view=summary&period=2026-11`);
  await expect(
    page.getByRole('heading', {
      name: 'No tienes permiso para consultar el resumen mensual',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Ver resumen mensual' }),
  ).toHaveCount(0);
  expect(calls.reads).toHaveLength(0);
  expect(calls.puts).toHaveLength(0);
});

test('Demo: consulta mensual usa Fetch no-store dentro de Axios', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.fetch;
    Object.assign(window, { periodCacheModes: [] as string[] });
    window.fetch = async (input, init) => {
      const request =
        input instanceof Request ? input : new Request(input, init);
      if (
        request.url.includes('/purchase-periods/') &&
        request.url.endsWith('/summary')
      ) {
        (
          window as unknown as { periodCacheModes: string[] }
        ).periodCacheModes.push(init?.cache ?? request.cache);
      }
      return original.call(window, input, init);
    };
  });
  await fixture(page);
  await page.goto(`${clientPath}&view=summary&period=2026-11`);
  await expect(page.getByText('−Q 23.45', { exact: true })).toBeVisible();
  const modes = await page.evaluate(
    () =>
      (window as unknown as { periodCacheModes: string[] }).periodCacheModes,
  );
  expect(modes.length).toBeGreaterThan(0);
  expect(modes.every((mode) => mode === 'no-store')).toBe(true);
});

test('Demo: contrato antiguo de cuatro estados no se muestra como resumen aprobado', async ({
  page,
}) => {
  await fixture(page, { legacyStatuses: true });
  await page.goto(`${clientPath}&view=summary&period=2026-11`);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(
    page.getByText('Total de compras aprobadas', { exact: true }),
  ).toHaveCount(0);
});

test('Demo: mes cambia consulta y estado vacío sin confundirlo con un error', async ({
  page,
}) => {
  const calls = await fixture(page);
  await page.goto(`${clientPath}&view=summary&period=2026-11`);
  await expect(page.getByText('−Q 23.45', { exact: true })).toBeVisible();
  await page.getByLabel('Mes y año', { exact: true }).fill('2026-12');
  await expect(page.getByText(/Aún no hay compras aprobadas/)).toBeVisible();
  expect(calls.reads).toContain('2026-12');
  await expect(page.getByText('−Q 23.45', { exact: true })).toHaveCount(0);
});

test('Demo: contador guarda monto decimal y protege cambios al cambiar mes', async ({
  page,
}) => {
  const calls = await fixture(page);
  await page.goto(`${counterPath}?view=summary&period=2026-11`);
  await page.getByRole('button', { name: 'Configurar monto' }).click();
  await page.getByLabel('Monto inicial en GTQ').fill('200');
  await page.getByLabel('Mes y año').fill('2026-12');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar aquí' }).click();
  await expect(page.getByLabel('Monto inicial en GTQ')).toHaveValue('200');
  await page.getByRole('button', { name: 'Guardar monto inicial' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Monto inicial guardado',
  );
  expect(calls.puts).toEqual([{ initialAmount: '200.00', currency: 'GTQ' }]);
  await expect(page.getByText('Q 76.55', { exact: true })).toBeVisible();
});

test('Demo: resultado incierto exige comprobar antes de repetir PUT', async ({
  page,
}) => {
  const calls = await fixture(page, { uncertainPut: true });
  await page.goto(`${counterPath}?view=summary&period=2026-11`);
  await page.getByRole('button', { name: 'Configurar monto' }).click();
  await page.getByLabel('Monto inicial en GTQ').fill('200.00');
  await page.getByRole('button', { name: 'Guardar monto inicial' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'No pudimos confirmar el guardado',
  );
  await expect(
    page.getByRole('button', { name: 'Guardar monto inicial' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Comprobar monto guardado' }).click();
  await expect(page.getByText('Q 76.55', { exact: true })).toBeVisible();
  expect(calls.puts).toHaveLength(1);
});

for (const summaryStatus of [401, 403, 404, 409, 503])
  test(`Demo: resumen ${summaryStatus} no muestra importes falsos`, async ({
    page,
  }) => {
    await fixture(page, { summaryStatus });
    await page.goto(`${clientPath}&view=summary&period=2026-11`);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(
      page.getByText('Disponible estimado', { exact: true }),
    ).toHaveCount(0);
  });
