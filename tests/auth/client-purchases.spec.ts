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
    seedStatus?:
      | 'draft'
      | 'pending_review'
      | 'needs_correction'
      | 'approved'
      | 'rejected'
      | 'discarded';
    detailStatus?: number;
    wrongContext?: boolean;
    failDiscardAfterAccept?: boolean;
  } = {},
) {
  await setup(page);
  let document: Record<string, unknown> | undefined = options.seedStatus
    ? {
        id: documentId,
        workspace_id: workspace.id,
        entity_id: entity.id,
        document_type: 'invoice',
        issue_date: '2026-11-13',
        issuer_name: 'Proveedor Demo',
        issuer_tax_id: 'DEMO-EMISOR',
        receiver_name: 'Receptor Demo',
        receiver_tax_id: 'C/F',
        description: 'Compra Demo\nDetalle en segunda línea',
        category: 'suministros',
        total: '123.45',
        currency: 'GTQ',
        status: options.seedStatus,
        created_at: '2026-11-13T12:00:00Z',
        updated_at: '2026-11-13T13:00:00Z',
        review_observation:
          options.seedStatus === 'needs_correction'
            ? 'Falta completar la descripción de la compra.'
            : null,
        observed_by:
          options.seedStatus === 'needs_correction'
            ? '77777777-7777-4777-8777-777777777777'
            : null,
        observed_at:
          options.seedStatus === 'needs_correction'
            ? '2026-11-13T14:00:00Z'
            : null,
      }
    : undefined;
  const calls = {
    creates: 0,
    submits: 0,
    lists: 0,
    checks: 0,
    discards: 0,
    returns: 0,
    patches: 0,
  };
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
    if (url.pathname === `${base}/${documentId}/discard` && method === 'POST') {
      calls.discards++;
      if (document) document.status = 'discarded';
      if (options.failDiscardAfterAccept && calls.discards === 1)
        return route.fulfill({
          status: 503,
          json: { error: 'DEMO_UNCERTAIN_DISCARD' },
        });
      return route.fulfill({ json: { document } });
    }
    if (
      url.pathname === `${base}/${documentId}/return-to-draft` &&
      method === 'POST'
    ) {
      calls.returns++;
      if (document) {
        document.status = 'needs_correction';
        document.review_observation = route
          .request()
          .postDataJSON().observation;
      }
      return route.fulfill({ json: { document } });
    }
    if (url.pathname === `${base}/${documentId}` && method === 'PATCH') {
      calls.patches++;
      const input = route.request().postDataJSON();
      if (document && input.description !== undefined)
        document.description = input.description;
      return route.fulfill({ json: { document } });
    }
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
      if (options.detailStatus)
        return route.fulfill({
          status: options.detailStatus,
          json: { error: 'DEMO_DETAIL_ERROR' },
        });
      return route.fulfill({
        json: {
          document: options.wrongContext
            ? { ...document, entity_id: '66666666-6666-4666-8666-666666666666' }
            : document,
        },
      });
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
    if (url.pathname === `${base}/${documentId}/discard` && method === 'POST') {
      if (document) document.status = 'discarded';
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

for (const status of ['draft', 'pending_review'] as const) {
  test(`Demo: detalle completo ${status}, recarga y edición según estado`, async ({
    page,
  }) => {
    const calls = await portal(page, { seedStatus: status });
    await page.getByRole('link', { name: 'Comprobantes', exact: true }).click();
    await page.getByLabel('Mostrar', { exact: true }).selectOption(status);
    await page
      .getByRole('link', { name: 'Ver detalle de Proveedor Demo' })
      .click();
    await expect(page).toHaveURL(`${path}&document=${documentId}`);
    const invoice = page.getByRole('article', {
      name: 'Datos del comprobante',
    });
    await expect(invoice).toContainText('DEMO-EMISOR');
    await expect(invoice).toContainText('Receptor Demo');
    await expect(invoice).toContainText('C/F');
    await expect(invoice).toContainText('Detalle en segunda línea');
    await expect(invoice).toContainText('suministros');
    await expect(invoice).toContainText('123.45');
    await expect(invoice).toContainText('GTQ');
    await expect(
      page.getByRole('link', { name: 'Editar borrador' }),
    ).toHaveCount(status === 'draft' ? 1 : 0);
    expect(calls.creates).toBe(0);
    expect(calls.submits).toBe(0);
    await expect(
      page.getByRole('link', { name: 'Volver a comprobantes' }),
    ).toHaveCount(2);
    // Return before reload so the in-memory list context is still available.
    await page
      .getByRole('link', { name: 'Volver a comprobantes' })
      .last()
      .click();
    await expect(page.getByLabel('Mostrar', { exact: true })).toHaveValue(
      status,
    );
    await expect(
      page.getByRole('link', { name: 'Ver detalle de Proveedor Demo' }),
    ).toBeFocused();
    await page
      .getByRole('link', { name: 'Ver detalle de Proveedor Demo' })
      .click();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Detalle de factura', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('link', { name: 'Volver a comprobantes' })
      .first()
      .click();
    await expect(
      page.getByRole('heading', { name: 'Comprobantes', exact: true }),
    ).toBeVisible();
  });
}

test('Demo: lectura permite consultar detalle sin ofrecer editar', async ({
  page,
}) => {
  await portal(page, { seedStatus: 'draft', readOnly: true });
  await page
    .getByRole('link', { name: 'Ver detalle de Proveedor Demo' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Detalle de factura' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Editar borrador' })).toHaveCount(
    0,
  );
});

for (const detailStatus of [403, 404, 503])
  test(`Demo: detalle ${detailStatus} no revela datos del listado`, async ({
    page,
  }) => {
    await portal(page, { seedStatus: 'draft', detailStatus });
    await page.getByRole('link', { name: 'Comprobantes', exact: true }).click();
    await page
      .getByRole('link', { name: 'Ver detalle de Proveedor Demo' })
      .click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Volver a comprobantes' }),
    ).toBeVisible();
  });

test('Demo: respuesta de otra entidad no se presenta como factura autorizada', async ({
  page,
}) => {
  await portal(page, { seedStatus: 'draft', wrongContext: true });
  await page.goto(`${path}&document=${documentId}`);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('Demo: descarte exige confirmar, conserva historial y no repite un POST ya aceptado', async ({
  page,
}) => {
  const calls = await portal(page, {
    seedStatus: 'draft',
    failDiscardAfterAccept: true,
  });
  await page.goto(`${path}&document=${documentId}`);
  await page
    .getByRole('button', { name: 'Descartar comprobante', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('no se eliminará físicamente');
  expect(calls.discards).toBe(0);
  await dialog.getByRole('button', { name: 'Conservar borrador' }).click();
  await expect(
    page.getByRole('button', { name: 'Descartar comprobante', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Descartar comprobante', exact: true })
    .click();
  await dialog
    .getByRole('button', { name: 'Descartar comprobante', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Descartar comprobante', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(calls.discards).toBe(1);
  await page
    .getByRole('link', { name: 'Volver a comprobantes' })
    .first()
    .click();
  await expect(
    page.getByRole('link', { name: 'Ver detalle de Proveedor Demo' }),
  ).toHaveCount(0);
  await page.getByLabel('Mostrar', { exact: true }).selectOption('discarded');
  await expect(
    page.getByRole('link', { name: 'Ver detalle de Proveedor Demo' }),
  ).toBeVisible();
});

test('Demo: cliente corrige con observación visible y reenvía sin crear otra factura', async ({
  page,
}) => {
  const calls = await portal(page, { seedStatus: 'needs_correction' });
  await page.goto(`${path}&draft=${documentId}`);
  await expect(
    page.getByRole('heading', { name: 'Corregir comprobante', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Falta completar la descripción de la compra.', {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel('Descripción de la compra', { exact: true })
    .fill('Descripción corregida Demo');
  await page
    .getByRole('button', { name: 'Enviar corrección a revisión', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Comprobante enviado a revisión' }),
  ).toBeVisible();
  expect(calls.creates).toBe(0);
  expect(calls.patches).toBe(1);
  expect(calls.submits).toBe(1);
});

for (const status of [
  'pending_review',
  'approved',
  'rejected',
  'discarded',
] as const)
  test(`Demo: cliente no modifica ${status}`, async ({ page }) => {
    await portal(page, { seedStatus: status });
    await page.goto(`${path}&document=${documentId}`);
    await expect(
      page.getByRole('article', { name: 'Datos del comprobante' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Editar borrador' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Descartar comprobante' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Solicitar corrección' }),
    ).toHaveCount(0);
  });

test('Demo: contador solicita corrección con observación obligatoria y estado revalidado', async ({
  page,
}) => {
  const calls = await portal(page, { seedStatus: 'pending_review' });
  await page.goto(
    `/workspaces/${workspace.id}/clients/${entity.id}/documents?document=${documentId}`,
  );
  await page.getByRole('button', { name: 'Solicitar corrección' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Solicitar corrección' }).click();
  await expect(dialog.getByLabel('Observación para el cliente')).toBeFocused();
  expect(calls.returns).toBe(0);
  await dialog
    .getByLabel('Observación para el cliente')
    .fill('Revisa la descripción del comprobante.');
  await dialog.getByRole('button', { name: 'Solicitar corrección' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('article')).toContainText(
    'Revisa la descripción del comprobante.',
  );
  expect(calls.returns).toBe(1);
});
