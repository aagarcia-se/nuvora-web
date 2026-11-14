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
    failApproveAfterAccept?: boolean;
    counterViewer?: boolean;
    decisionStatus?: number;
  } = {},
) {
  await setup(page, { viewer: options.counterViewer });
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
    approves: 0,
    rejects: 0,
    rejectionReason: '',
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
              role: options.readOnly ? 'client_viewer' : 'client_contributor',
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
    if (url.pathname === `${base}/${documentId}/photo` && method === 'GET')
      return route.fulfill({ json: { photo: null } });
    if (url.pathname === `${base}/${documentId}/approve` && method === 'POST') {
      calls.approves++;
      if (options.decisionStatus)
        return route.fulfill({
          status: options.decisionStatus,
          json: { error: 'DEMO_DECISION_ERROR' },
        });
      if (document) {
        document.status = 'approved';
        document.reviewed_by = '77777777-7777-4777-8777-777777777777';
        document.reviewed_at = '2026-11-13T16:00:00Z';
      }
      if (options.failApproveAfterAccept && calls.approves === 1)
        return route.fulfill({
          status: 503,
          json: { error: 'DEMO_UNCERTAIN_APPROVE' },
        });
      return route.fulfill({ json: { document } });
    }
    if (url.pathname === `${base}/${documentId}/reject` && method === 'POST') {
      calls.rejects++;
      if (options.decisionStatus)
        return route.fulfill({
          status: options.decisionStatus,
          json: { error: 'DEMO_DECISION_ERROR' },
        });
      calls.rejectionReason = route.request().postDataJSON().reason;
      if (document) {
        document.status = 'rejected';
        document.reviewed_at = '2026-11-13T16:00:00Z';
      }
      // Current backend returns no persistent rejection-reason field.
      return route.fulfill({ json: { document } });
    }
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

// Private-photo contracts are synthetic; these cases remain NOT EXECUTED.
const photoId = '88888888-8888-4888-8888-888888888888';
const demoPhoto = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=',
  'base64',
);
async function photos(
  page: Page,
  options: {
    initial?: boolean;
    uncertainConfirm?: boolean;
    failConfirm?: boolean;
    uncertainDelete?: boolean;
  } = {},
) {
  let active = Boolean(options.initial);
  let activeId = options.initial
    ? '99999999-9999-4999-8999-999999999999'
    : photoId;
  const calls = {
    uploads: 0,
    confirms: 0,
    deletes: 0,
    binaryAuthorization: '',
    metadata: 0,
  };
  const base = `http://api.demo.test/api/v1/workspaces/${workspace.id}/entities/${entity.id}/purchase-documents/${documentId}/photo`;
  await page.route(`${base}**`, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      calls.metadata++;
      return route.fulfill({
        json: {
          photo: active
            ? {
                id: activeId,
                mimeType: 'image/png',
                byteSize: demoPhoto.length,
                expiresIn: 300,
                url: 'https://auth.demo.test/storage/v1/object/sign/demo.png?token=demo-only',
              }
            : null,
        },
      });
    }
    if (request.url().endsWith('/upload-url')) {
      calls.uploads++;
      return route.fulfill({
        status: 201,
        json: {
          upload: {
            fileId: photoId,
            signedUrl:
              'https://auth.demo.test/storage/v1/object/upload/sign/demo.png?token=demo-only',
            expiresIn: 300,
            mimeType: 'image/png',
            maxBytes: 10 * 1024 * 1024,
          },
        },
      });
    }
    if (request.url().endsWith('/confirm')) {
      calls.confirms++;
      active = !options.failConfirm;
      if (active) activeId = photoId;
      if (options.uncertainConfirm || options.failConfirm)
        return route.fulfill({
          status: 503,
          json: { error: 'DEMO_PHOTO_CONFIRM_UNCERTAIN' },
        });
      return route.fulfill({ json: { photo: { id: photoId } } });
    }
    if (request.method() === 'DELETE') {
      calls.deletes++;
      active = false;
      if (options.uncertainDelete)
        return route.fulfill({
          status: 503,
          json: { error: 'DEMO_PHOTO_DELETE_UNCERTAIN' },
        });
      return route.fulfill({ json: { deleted: true } });
    }
    return route.fallback();
  });
  await page.route('https://auth.demo.test/storage/v1/**', async (route) => {
    if (route.request().method() === 'PUT') {
      calls.binaryAuthorization = route.request().headers().authorization ?? '';
      return route.fulfill({ json: {} });
    }
    return route.fulfill({ contentType: 'image/png', body: demoPhoto });
  });
  return calls;
}

test('Demo foto: reemplazar requiere confirmación y valida archivos antes de escribir', async ({
  page,
}) => {
  await portal(page, { seedStatus: 'needs_correction' });
  const calls = await photos(page, { initial: true });
  await page.goto(`${path}&draft=${documentId}`);
  await expect(
    page.getByRole('button', { name: 'Agregar foto', exact: true }),
  ).toBeEnabled();
  const picker = page.getByLabel('Elegir foto del comprobante', {
    exact: true,
  });
  await picker.setInputFiles({
    name: 'archivo.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('Demo'),
  });
  await expect(page.getByRole('alert')).toContainText('Elige una foto');
  await picker.setInputFiles({
    name: 'grande.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole('alert')).toContainText('10 MiB');
  expect(calls.uploads).toBe(0);
  await picker.setInputFiles({
    name: 'foto-demo.png',
    mimeType: 'image/png',
    buffer: demoPhoto,
  });
  const replace = page.getByRole('button', {
    name: 'Reemplazar foto',
    exact: true,
  });
  await replace.click();
  await expect(page.getByRole('dialog')).toContainText('nueva foto');
  expect(calls.uploads).toBe(0);
  await page.keyboard.press('Escape');
  await expect(replace).toBeFocused();
  await replace.click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reemplazar foto', exact: true })
    .click();
  await expect(
    page.getByText('Foto adjunta y confirmada.', { exact: true }),
  ).toBeVisible();
  expect(calls.uploads).toBe(1);
  expect(calls.confirms).toBe(1);
});

test('Demo foto: captura sin imagen sigue siendo opcional y no consulta almacenamiento', async ({
  page,
}) => {
  const calls = await portal(page);
  const photoCalls = await photos(page);
  await fillInvoice(page);
  await page
    .getByRole('button', { name: 'Enviar a revisión', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Comprobante enviado a revisión' }),
  ).toBeVisible();
  expect(calls.creates).toBe(1);
  expect(photoCalls.metadata).toBe(0);
  expect(photoCalls.uploads).toBe(0);
});

for (const uncertainConfirm of [false, true])
  test(`Demo foto: adjunto confirmado y recuperación sin repetir POST, incierto=${uncertainConfirm}`, async ({
    page,
  }) => {
    await portal(page, { seedStatus: 'draft' });
    const calls = await photos(page, { uncertainConfirm });
    await page.goto(`${path}&draft=${documentId}`);
    await expect(
      page.getByRole('button', { name: 'Agregar foto', exact: true }),
    ).toBeEnabled();
    await page
      .getByLabel('Elegir foto del comprobante', { exact: true })
      .setInputFiles({
        name: 'foto-demo.png',
        mimeType: 'image/png',
        buffer: demoPhoto,
      });
    await expect(
      page.getByRole('button', { name: 'Enviar a revisión', exact: true }),
    ).toBeDisabled();
    await page
      .getByRole('button', { name: 'Adjuntar foto', exact: true })
      .click();
    if (uncertainConfirm) {
      await expect(page.getByRole('alert')).toContainText('servicio de fotos');
      await expect(
        page.getByText('Foto adjunta y confirmada.', { exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole('button', { name: 'Comprobar estado de la foto' })
        .click();
    }
    await expect(
      page.getByText('Foto adjunta y confirmada.', { exact: true }),
    ).toBeVisible();
    expect(calls.confirms).toBe(1);
    expect(calls.uploads).toBe(1);
    expect(calls.binaryAuthorization).toBe('');
    await expect(
      page.getByRole('button', { name: 'Enviar a revisión', exact: true }),
    ).toBeEnabled();
  });

test('Demo foto: confirmación fallida conserva selección y no anuncia adjunto activo', async ({
  page,
}) => {
  await portal(page, { seedStatus: 'draft' });
  const calls = await photos(page, { failConfirm: true });
  await page.goto(`${path}&draft=${documentId}`);
  await expect(
    page.getByRole('button', { name: 'Agregar foto', exact: true }),
  ).toBeEnabled();
  await page
    .getByLabel('Elegir foto del comprobante', { exact: true })
    .setInputFiles({
      name: 'foto-demo.png',
      mimeType: 'image/png',
      buffer: demoPhoto,
    });
  await page
    .getByRole('button', { name: 'Adjuntar foto', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Comprobar estado de la foto' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Comprobar estado de la foto' })
    .click();
  await expect(
    page.getByText('Seleccionada · Todavía no está adjunta'),
  ).toBeVisible();
  await expect(
    page.getByText('Foto adjunta y confirmada.', { exact: true }),
  ).toHaveCount(0);
  expect(calls.confirms).toBe(1);
});

test('Demo foto: eliminar confirma, Escape restaura foco y respuesta incierta no repite DELETE', async ({
  page,
}) => {
  await portal(page, { seedStatus: 'draft' });
  const calls = await photos(page, { initial: true, uncertainDelete: true });
  await page.goto(`${path}&document=${documentId}`);
  const remove = page.getByRole('button', {
    name: 'Eliminar foto',
    exact: true,
  });
  await remove.click();
  await page.keyboard.press('Escape');
  await expect(remove).toBeFocused();
  expect(calls.deletes).toBe(0);
  await remove.click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Eliminar foto', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Comprobar estado de la foto' })
    .click();
  await expect(
    page.getByText('Este comprobante no tiene foto.', { exact: false }),
  ).toBeVisible();
  expect(calls.deletes).toBe(1);
});

for (const seedStatus of [
  'pending_review',
  'approved',
  'rejected',
  'discarded',
] as const)
  test(`Demo foto: ${seedStatus} solo permite consultar`, async ({ page }) => {
    await portal(page, { seedStatus });
    await photos(page, { initial: true });
    await page.goto(`${path}&document=${documentId}`);
    await expect(
      page.getByRole('link', { name: 'Abrir foto adjunta en tamaño completo' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Agregar foto', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Eliminar foto', exact: true }),
    ).toHaveCount(0);
  });

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

const counterDocumentPath = `/workspaces/${workspace.id}/clients/${entity.id}/documents?document=${documentId}`;
test('Demo: aprobación interna confirmada y reintento sin duplicar una decisión aceptada', async ({
  page,
}) => {
  const calls = await portal(page, {
    seedStatus: 'pending_review',
    failApproveAfterAccept: true,
  });
  await page.goto(counterDocumentPath);
  await page.getByRole('button', { name: 'Aprobar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('No significa validación SAT');
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(
    page.getByRole('button', { name: 'Aprobar', exact: true }),
  ).toBeFocused();
  expect(calls.approves).toBe(0);
  await page.getByRole('button', { name: 'Aprobar', exact: true }).click();
  await dialog.getByRole('button', { name: 'Aprobar', exact: true }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByRole('button', { name: 'Aprobar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('article')).toContainText(
    'Aprobada internamente',
  );
  expect(calls.approves).toBe(1);
  await expect(
    page.getByRole('button', { name: 'Rechazar', exact: true }),
  ).toHaveCount(0);
});

test('Demo: rechazo valida razón recortada y conserva texto ante error de validación', async ({
  page,
}) => {
  const calls = await portal(page, { seedStatus: 'pending_review' });
  await page.goto(counterDocumentPath);
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const reason = dialog.getByLabel('Motivo del rechazo', { exact: true });
  await reason.fill('   ');
  await dialog.getByRole('button', { name: 'Rechazar', exact: true }).click();
  expect(calls.rejects).toBe(0);
  await expect(reason).toBeFocused();
  await reason.fill('x'.repeat(2001));
  await dialog.getByRole('button', { name: 'Rechazar', exact: true }).click();
  expect(calls.rejects).toBe(0);
  await reason.fill('  Información inconsistente Demo.  ');
  await dialog.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(calls.rejectionReason).toBe('Información inconsistente Demo.');
  await expect(page.getByRole('article')).toContainText('Rechazada');
  await expect(
    page.getByText(
      'El motivo del rechazo no está disponible en la información de este comprobante.',
    ),
  ).toBeVisible();
});

for (const counter of [false, true])
  test(`Demo: decisiones no disponibles para ${counter ? 'workspace viewer' : 'cliente'}`, async ({
    page,
  }) => {
    await portal(page, {
      seedStatus: 'pending_review',
      counterViewer: counter,
    });
    await page.goto(
      counter ? counterDocumentPath : `${path}&document=${documentId}`,
    );
    await expect(page.getByRole('article')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Aprobar', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Rechazar', exact: true }),
    ).toHaveCount(0);
  });

for (const decisionStatus of [401, 403, 404, 409, 503])
  test(`Demo: aprobación ${decisionStatus} no confirma éxito ni reintenta el POST`, async ({
    page,
  }) => {
    const calls = await portal(page, {
      seedStatus: 'pending_review',
      decisionStatus,
    });
    await page.goto(counterDocumentPath);
    await page.getByRole('button', { name: 'Aprobar', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Aprobar', exact: true })
      .click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    expect(calls.approves).toBe(1);
    await expect(page.getByRole('article')).not.toContainText(
      'Aprobada internamente',
    );
  });
