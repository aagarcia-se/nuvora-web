import { test, expect, type Page } from '@playwright/test';
import { setup, workspace, entity } from './access.fixture';

// Synthetic Demo contracts. Prepared only: do not execute without authorization.
const path = `/client/entities/${entity.id}?workspaceId=${workspace.id}`;
const documentId = '55555555-5555-4555-8555-555555555555';
async function portal(
  page: Page,
  options: {
    readOnly?: boolean;
    acceptedBeforeFailure?: boolean;
    failSend?: boolean;
  } = {},
) {
  await setup(page);
  let document: Record<string, unknown> | undefined;
  const calls = { creates: 0, submits: 0, lists: 0, checks: 0 };
  await page.route('http://api.demo.test/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
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
                  can_upload: !options.readOnly,
                  can_review: false,
                  can_manage: false,
                },
              },
            },
          ],
        },
      });
    const base = `/api/v1/workspaces/${workspace.id}/entities/${entity.id}/purchase-documents`;
    if (url.pathname === base && method === 'GET') {
      calls.lists++;
      return route.fulfill({ json: { documents: document ? [document] : [] } });
    }
    if (url.pathname === base && method === 'POST') {
      calls.creates++;
      const input = route.request().postDataJSON();
      document = {
        id: documentId,
        workspace_id: workspace.id,
        entity_id: entity.id,
        document_type: input.documentType,
        issue_date: input.issueDate,
        issuer_name: input.issuerName,
        issuer_tax_id: input.issuerTaxId ?? null,
        receiver_name: input.receiverName,
        receiver_tax_id: input.receiverTaxId,
        description: input.description,
        category: input.category,
        total: input.total,
        currency: 'GTQ',
        status: 'draft',
        created_at: '2026-11-13T12:00:00Z',
        updated_at: '2026-11-13T12:00:00Z',
      };
      return route.fulfill({ json: { document } });
    }
    if (url.pathname === `${base}/${documentId}` && method === 'GET') {
      calls.checks++;
      return route.fulfill({ json: { document } });
    }
    if (url.pathname === `${base}/${documentId}/submit-review`) {
      calls.submits++;
      if (
        document &&
        (options.acceptedBeforeFailure ||
          calls.submits > 1 ||
          !options.failSend)
      )
        document.status = 'pending_review';
      if (options.failSend && calls.submits === 1)
        return route.fulfill({
          status: 503,
          json: { error: 'DEMO_UNCERTAIN_SEND' },
        });
      return route.fulfill({ json: { document } });
    }
    return route.fallback();
  });
  await page.goto(path);
  return calls;
}
async function fillInvoice(page: Page) {
  await page.getByLabel('Total', { exact: true }).fill('123.45');
  await page.getByLabel('Categoría', { exact: true }).fill('suministros');
  await page
    .getByLabel('Nombre del emisor', { exact: true })
    .fill('Proveedor Demo');
  await page
    .getByLabel('Descripción de la compra', { exact: true })
    .fill('Compra Demo');
}

test('Demo: captura primero; lista bajo demanda y acceso secundario', async ({
  page,
}) => {
  const calls = await portal(page);
  await expect(
    page.getByRole('heading', { name: 'Registrar factura', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Empresa activa')).toContainText(
    entity.legal_name,
  );
  expect(calls.lists).toBe(0);
  await page.getByRole('link', { name: 'Comprobantes', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Comprobantes', exact: true }),
  ).toBeVisible();
  await expect.poll(() => calls.lists).toBe(1);
});

for (const acceptedBeforeFailure of [false, true])
  test(`Demo: envío incierto conserva ID, aceptado=${acceptedBeforeFailure}`, async ({
    page,
  }) => {
    const calls = await portal(page, { failSend: true, acceptedBeforeFailure });
    await fillInvoice(page);
    await page
      .getByRole('button', { name: 'Enviar a revisión', exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText(
      'Tu borrador está guardado',
    );
    await page
      .getByRole('button', { name: 'Reintentar envío', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Comprobante enviado a revisión' }),
    ).toBeVisible();
    expect(calls.creates).toBe(1);
    expect(calls.checks).toBe(1);
    expect(calls.submits).toBe(acceptedBeforeFailure ? 1 : 2);
  });

test('Demo: validación no escribe y navegación protege cambios', async ({
  page,
}) => {
  const calls = await portal(page);
  await fillInvoice(page);
  await page.getByLabel('Total', { exact: true }).fill('0.00');
  await page
    .getByRole('button', { name: 'Enviar a revisión', exact: true })
    .click();
  await expect(page.getByLabel('Total', { exact: true })).toBeFocused();
  expect(calls.creates).toBe(0);
  await page.getByRole('link', { name: 'Comprobantes', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar aquí' }).click();
  await expect(
    page.getByLabel('Nombre del emisor', { exact: true }),
  ).toHaveValue('Proveedor Demo');
});

test('Demo: capacidad de lectura no muestra captura ni permite crear', async ({
  page,
}) => {
  const calls = await portal(page, { readOnly: true });
  await expect(
    page.getByRole('heading', { name: 'Comprobantes', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Registrar factura', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel('Nombre del emisor', { exact: true }),
  ).toHaveCount(0);
  expect(calls.creates).toBe(0);
});
