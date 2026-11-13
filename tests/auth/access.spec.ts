import { test, expect, type Page } from '@playwright/test';
import {
  setup,
  select,
  openClient,
  workspace,
  entity,
  user,
} from './access.fixture';
const invitationId = '55555555-5555-4555-8555-555555555555';
const membershipId = '66666666-6666-4666-8666-666666666666';
const demoToken = 'demoInvitationToken_OnlyForMocks_1234567890';
const expiresAt = '2099-12-31T00:00:00Z';
const base = `/api/v1/workspaces/${workspace.id}/entities/${entity.id}`;
const member = {
  id: membershipId,
  user_id: user.id,
  workspace_id: workspace.id,
  entity_id: entity.id,
  role: 'client_viewer',
  status: 'active',
  joined_at: user.created_at,
  revoked_at: null,
  user: {
    id: user.id,
    display_name: 'Cliente Demo',
    avatar_url: 'https://cdn.demo.test/avatar.png',
  },
};
async function admin(
  page: Page,
  options: {
    status?: number;
    viewer?: boolean;
    profile?: 'present' | 'missing' | 'null-fields' | 'invalid-avatar';
    invitationStatus?: 'pending' | 'accepted';
  } = {},
) {
  await setup(page, { viewer: options.viewer });
  let revoked = false;
  let invitationRevoked = false;
  let rotations = 0;
  const writes: unknown[] = [];
  await page.route('http://api.demo.test/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path === `${base}/memberships`)
      return route.fulfill({
        json: {
          memberships: [
            {
              ...member,
              user:
                options.profile === 'missing'
                  ? null
                  : options.profile === 'null-fields' || options.profile === 'invalid-avatar'
                    ? { id: user.id, display_name: null, avatar_url: null }
                    : member.user,
              status: revoked ? 'revoked' : 'active',
              revoked_at: revoked ? user.created_at : null,
            },
          ],
        },
       });
    if (path === `${base}/invitations` && method === 'GET')
      return route.fulfill({
        json: {
          invitations: [
            {
              id: invitationId,
              workspace_id: workspace.id,
              entity_id: entity.id,
              role: 'client_viewer',
               status: invitationRevoked
                 ? 'revoked'
                 : (options.invitationStatus ?? 'pending'),
              expires_at: expiresAt,
              created_at: user.created_at,
              accepted_at:
                options.invitationStatus === 'accepted' ? user.created_at : null,
              accepted_by:
                options.invitationStatus === 'accepted' ? user.id : null,
              accepted_by_profile:
                options.invitationStatus === 'accepted'
                  ? options.profile === 'missing'
                    ? null
                    : options.profile === 'null-fields' || options.profile === 'invalid-avatar'
                      ? { id: user.id, display_name: null, avatar_url: null }
                      : {
                          id: user.id,
                          display_name: 'Cliente Demo',
                          avatar_url: 'https://cdn.demo.test/avatar.png',
                        }
                  : null,
              revoked_at: invitationRevoked ? user.created_at : null,
              revocation_reason: invitationRevoked ? 'manual' : null,
            },
          ],
        },
      });
    if (path === `${base}/invitations` && method === 'POST') {
      writes.push(route.request().postDataJSON());
      return route.fulfill({
        status: options.status ?? 201,
        json: options.status
          ? { error: 'DEMO_ERROR' }
          : {
              invitation: {
                id: invitationId,
                status: 'pending',
                expiresAt,
                acceptUrl: `${new URL(page.url()).origin}/invitations/accept?token=${demoToken}`,
              },
            },
      });
    }
    if (path === `${base}/memberships/${membershipId}/revoke`) {
      revoked = true;
      return route.fulfill({ json: { revoked: true } });
    }
    if (path === `${base}/invitations/${invitationId}/revoke`) {
      invitationRevoked = true;
      return route.fulfill({ json: { revoked: true } });
    }
    if (path === `${base}/invitations/${invitationId}/share-link`) {
      rotations++;
      return route.fulfill({
        json: {
          invitation: {
            id: invitationId,
            status: 'pending',
            expiresAt,
            acceptUrl: `${new URL(page.url()).origin}/invitations/accept?token=${demoToken}${rotations}`,
          },
        },
      });
    }
    return route.fallback();
  });
  await select(page);
  await openClient(page);

  return { writes, rotations: () => rotations };
}
async function invite(page: Page) {
  await page.getByRole('button', { name: 'Crear enlace', exact: true }).click();
}
async function inspection(page: Page, status = 'pending', acceptStatus = 200) {
  await page.route('http://api.demo.test/api/v1/invitations/**', (route) => {
    if (route.request().method() === 'POST')
      return route.fulfill({
        status: acceptStatus,
        json:
          acceptStatus === 200
            ? {
                membership: {
                  membershipId,
                  workspaceId: workspace.id,
                  entityId: entity.id,
                  role: 'client_viewer',
                },
              }
            : {
                error:
                  acceptStatus === 403
                    ? 'ACCESS_MANAGE_FORBIDDEN'
                    : 'INVITATION_UNAVAILABLE',
              },
      });
    return route.fulfill({
      json: {
        invitation: {
          status,
          role: 'client_viewer',
          expiresAt,
          workspaceId: workspace.id,
          entityId: entity.id,
        },
      },
    });
  });
  await page.goto(`/invitations/accept?token=${demoToken}`);
}

test('Demo: crea con solo rol y muestra enlace sin una segunda petición', async ({
  page,
}) => {
  const api = await admin(page);
  await invite(page);
  await expect(page.getByLabel('Enlace de invitación')).toBeVisible();
  await expect(page.getByRole('status')).toContainText(
    'Enlace listo para compartir.',
  );
  expect(api.writes).toEqual([{ role: 'client_viewer' }]);
  expect(api.rotations()).toBe(0);
  await expect(page.getByLabel('Correo del destinatario')).toHaveCount(0);
});
test('Demo: rol explícito enviado al crear enlace', async ({ page }) => {
  const api = await admin(page);
  await page.getByLabel('Acceso al cliente').selectOption('client_contributor');
  await invite(page);
  await expect(page.getByLabel('Enlace de invitación')).toBeVisible();
  expect(api.writes).toEqual([{ role: 'client_contributor' }]);
});
test('Demo: viewer no monta administración', async ({ page }) => {
  await admin(page, { viewer: true });
  await expect(
    page.getByRole('button', { name: 'Administrar accesos' }),
  ).toHaveCount(0);
});
for (const status of [401, 403, 404, 409, 410, 429, 503])
  test(`Demo: invitación ${status} segura, sin reintento automático`, async ({
    page,
  }) => {
    const api = await admin(page, { status });
    await invite(page);
    await expect(page.getByRole('alert')).toBeVisible();
    expect(api.writes).toHaveLength(1);
  });
test('Demo: confirmación y revocación conservan historial', async ({
  page,
}) => {
  await admin(page);
  await page.getByText('Personas con acceso', { exact: true }).click();
  await page
    .getByRole('button', { name: `Revocar acceso de ${user.id}` })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Revocar acceso',
    exact: true,
  });
  await expect(dialog).toContainText('conserva el historial');
  await dialog.getByRole('button', { name: 'Confirmar revocación' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText('Solo lectura · Revocada', { exact: true }),
  ).toBeVisible();
});
test('Demo: lista y revocación de invitación pendiente conservan historial', async ({
  page,
}) => {
  await admin(page);
  await page.getByText('Historial de invitaciones', { exact: true }).click();
  await page
    .getByRole('button', { name: `Revocar invitación ${invitationId}` })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Revocar invitación',
    exact: true,
  });
  await dialog.getByRole('button', { name: 'Confirmar revocación' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('Revocada · no aceptable')).toBeVisible();
});
test('Demo: aceptación muestra perfil visible y UUID secundario', async ({
  page,
}) => {
  await admin(page, { invitationStatus: 'accepted' });
  await page.getByText('Historial de invitaciones', { exact: true }).click();
  await expect(page.getByText('Cliente Demo', { exact: true })).toBeVisible();
  await expect(page.getByText(`Usuario: ${user.id}`, { exact: true })).toBeVisible();
});
test('Demo: perfiles ausentes y campos nulos usan fallback seguro', async ({
  page,
}) => {
  await admin(page, { profile: 'missing', invitationStatus: 'accepted' });
  await page.getByText('Personas con acceso', { exact: true }).click();
  await expect(page.getByText('Usuario sin nombre', { exact: true })).toBeVisible();
  await expect(page.getByText(`Usuario: ${user.id}`, { exact: true })).toBeVisible();
});
test('Demo: avatar inválido ya normalizado a null conserva iniciales', async ({
  page,
}) => {
  await admin(page, { profile: 'invalid-avatar' });
  await page.getByText('Personas con acceso', { exact: true }).click();
  await expect(page.getByText('Usuario sin nombre', { exact: true })).toBeVisible();
});
test('Demo: enlace rotado, copiar y WhatsApp sin envío automático', async ({
  page,
  context,
}) => {
  const api = await admin(page);
  await invite(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const first = await page.getByLabel('Enlace de invitación').inputValue();
  await page
    .getByRole('button', { name: 'Copiar enlace', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(first);
  await expect(
    page.getByRole('link', { name: 'Compartir por WhatsApp' }),
  ).toHaveAttribute(
    'href',
    `https://wa.me/?text=${encodeURIComponent('Accede a este cliente con tu cuenta de Nuvora y confirma la invitación.\n' + first)}`,
  );
  await page.getByText('Opciones del enlace', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Reemplazar enlace anterior' })
    .click();
  await expect(page.getByLabel('Enlace de invitación')).not.toHaveValue(first);
  expect(api.rotations()).toBe(1);
});
test('Demo: Web Share y fallback a copiar', async ({ page }) => {
  await admin(page);
  await invite(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => {
        document.body.dataset.shareCalled = 'true';
      },
    });
  });
  await page.getByText('Opciones del enlace', { exact: true }).click();
  await page.getByRole('button', { name: 'Compartir', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-share-called',
    'true',
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          document.body.dataset.copyCalled = 'true';
        },
      },
    });
  });
  await page.getByRole('button', { name: 'Compartir', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-copy-called',
    'true',
  );
});
for (const status of ['pending', 'expired', 'revoked', 'accepted'])
  test(`Demo: inspección ${status} y token fuera de URL/storage/Query`, async ({
    page,
  }) => {
    await setup(page);
    await inspection(page, status);
    await expect(page).toHaveURL(/\/invitations\/accept$/);
    if (status === 'pending')
      await expect(
        page.getByRole('button', { name: 'Aceptar invitación' }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole('button', { name: 'Aceptar invitación' }),
      ).toHaveCount(0);
    const exposed = await page.evaluate(async (secret) => {
      const modulePath = '/src/shared/api/queryClient.ts';
      const { queryClient } = await import(/* @vite-ignore */ modulePath);
      return JSON.stringify({
        local: { ...localStorage },
        session: { ...sessionStorage },
        queries: queryClient
          .getQueryCache()
          .getAll()
          .map((q: { queryKey: unknown; state: unknown }) => ({
            key: q.queryKey,
            state: q.state,
          })),
        mutations: queryClient.getMutationCache().getAll(),
      }).includes(secret);
    }, demoToken);
    expect(exposed).toBe(false);
  });
test('Demo: sin sesión pide autenticarse sin inspección pública', async ({
  page,
}) => {
  let reads = 0;
  await page.route('**/api/v1/invitations/**', (route) => {
    reads++;
    return route.fulfill({ status: 401 });
  });
  await page.goto(`/invitations/accept?token=${demoToken}`);
  await expect(
    page.getByRole('heading', { name: 'Iniciar sesión' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/invitations\/accept$/);
  expect(reads).toBe(0);
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page.getByLabel('Confirmar contraseña')).toBeVisible();
});
test('Demo: aceptación exitosa abre solo el contexto devuelto por API', async ({
  page,
}) => {
  await setup(page);
  await inspection(page);
  await page.getByRole('button', { name: 'Aceptar invitación' }).click();
  await expect(page).toHaveURL(
    new RegExp(`/client/entities/${entity.id}\\?workspaceId=${workspace.id}$`),
  );
  await expect(
    page.getByRole('heading', { name: entity.legal_name }),
  ).toBeVisible();
});
test('Demo: cualquier cuenta autenticada confirma la aceptación sin validar destinatario', async ({
  page,
}) => {
  await setup(page);
  await inspection(page);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Aceptar invitación' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Aceptar invitación' }).click();
  await expect(page).toHaveURL(
    new RegExp(`/client/entities/${entity.id}\\?workspaceId=${workspace.id}$`),
  );
});

test('Demo: compartir 410 elimina el enlace anterior y no reintenta', async ({
  page,
}) => {
  await admin(page);
  await invite(page);
  await expect(page.getByLabel('Enlace de invitación')).toBeVisible();
  let calls = 0;
  await page.route(`**/invitations/${invitationId}/share-link`, (route) => {
    calls++;
    return route.fulfill({
      status: 410,
      json: { error: 'INVITATION_UNAVAILABLE' },
    });
  });
  await page.getByText('Opciones del enlace', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Reemplazar enlace anterior' })
    .click();
  await expect(page.getByRole('alert')).toContainText('expirada');
  await expect(page.getByLabel('Enlace de invitación')).toHaveCount(0);
  expect(calls).toBe(1);
});

test('Demo: aceptación 410 impide repetir con el mismo enlace', async ({
  page,
}) => {
  await setup(page);
  await inspection(page, 'pending', 410);
  await page.getByRole('button', { name: 'Aceptar invitación' }).click();
  await expect(
    page.getByText(
      'Este enlace ya no permite aceptar la invitación. Solicita una nueva al contador.',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Aceptar invitación' }),
  ).toHaveCount(0);
});

test('Demo: compartir pendiente bloquea doble envío y salir descarta respuesta', async ({
  page,
}) => {
  await admin(page);
  await invite(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  await page.route(
    `**/invitations/${invitationId}/share-link`,
    async (route) => {
      calls++;
      await pending;
      await route
        .fulfill({
          json: {
            invitation: {
              id: invitationId,
              status: 'pending',
              expiresAt,
              acceptUrl: `${new URL(page.url()).origin}/invitations/accept?token=${demoToken}`,
            },
          },
        })
        .catch(() => {});
    },
  );
  await page.getByText('Opciones del enlace', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Reemplazar enlace anterior' })
    .click();
  await expect(page.getByRole('button', { name: 'Generando…' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cerrar accesos' }).click();
  release();
  await page.getByRole('button', { name: 'Administrar accesos' }).click();
  await expect(page.getByLabel('Enlace de invitación')).toHaveCount(0);
  expect(calls).toBe(1);
});

test('Demo: crear conserva el enlace fuera de almacenamiento y caché', async ({
  page,
}) => {
  await admin(page);
  await invite(page);
  await expect(page.getByLabel('Enlace de invitación')).toBeVisible();
  const leaked = await page.evaluate(async (secret) => {
    const modulePath = '/src/shared/api/queryClient.ts';
    const { queryClient } = await import(/* @vite-ignore */ modulePath);
    return JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
      queries: queryClient
        .getQueryCache()
        .getAll()
        .map((q: { state: unknown; queryKey: unknown }) => ({
          key: q.queryKey,
          state: q.state,
        })),
      mutations: queryClient.getMutationCache().getAll(),
    }).includes(secret);
  }, demoToken);
  expect(leaked).toBe(false);
});
test('Demo: la inspección no acepta automáticamente y muestra contexto y rol', async ({
  page,
}) => {
  await setup(page);
  let accepted = 0;
  await page.route('**/api/v1/invitations/**', (route) => {
    if (route.request().method() === 'POST') accepted++;
    return route.fulfill({
      json: {
        invitation: {
          status: 'pending',
          role: 'client_viewer',
          expiresAt,
          workspaceId: workspace.id,
          entityId: entity.id,
        },
      },
    });
  });
  await page.goto(`/invitations/accept?token=${demoToken}`);
  await expect(
    page.getByRole('button', { name: 'Aceptar invitación' }),
  ).toBeVisible();
  await expect(page.getByText(workspace.id, { exact: true })).toBeVisible();
  await expect(page.getByText(entity.id, { exact: true })).toBeVisible();
  expect(accepted).toBe(0);
});

test('Demo: continuidad link-first conserva la invitación al cancelar OAuth', async ({
  page,
}) => {
  await page.goto(`/invitations/accept?token=${demoToken}`);
  await page.evaluate(async () => {
    const modulePath = '/src/features/access/invitationToken.ts';
    const module = await import(/* @vite-ignore */ modulePath);
    module.persistInvitationContinuation();
  });
  await page.goto('/auth/callback?error=access_denied');
  await expect(page.getByRole('alert')).toContainText('Cancelaste');
  await expect(
    page.getByRole('link', { name: 'Volver a la invitación' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Volver a la invitación' }).click();
  await expect(page).toHaveURL(/\/invitations\/accept$/);
  await expect(page.evaluate(() => ({ ...sessionStorage }))).resolves.toEqual(
    expect.objectContaining({
      'nuvora.invitation.continuation.v1': expect.stringContaining(demoToken),
    }),
  );
});

test('Demo: continuidad expirada se elimina y exige reabrir el enlace', async ({
  page,
}) => {
  await page.addInitScript((token) => {
    sessionStorage.setItem(
      'nuvora.invitation.continuation.v1',
      JSON.stringify({ token, createdAt: Date.now() - 11 * 60 * 1000 }),
    );
  }, demoToken);
  await page.goto('/invitations/accept');
  await expect(
    page.getByRole('heading', { name: 'Vuelve a abrir la invitación' }),
  ).toBeVisible();
  await expect(page.evaluate(() => ({ ...sessionStorage }))).resolves.toEqual(
    {},
  );
});
