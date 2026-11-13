// Ephemeral callback token. sessionStorage is used only to bridge a full OAuth
// redirect; it is tab-scoped, short-lived and removed as soon as the flow ends.
let pendingToken: string | null = null;
const CONTINUATION_KEY = 'nuvora.invitation.continuation.v1';
const CONTINUATION_TTL_MS = 10 * 60 * 1000;
type Continuation = { token: string; createdAt: number };

function readContinuation(): Continuation | null {
  try {
    const raw = window.sessionStorage.getItem(CONTINUATION_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== 'object' ||
      !('token' in value) ||
      !('createdAt' in value) ||
      typeof value.token !== 'string' ||
      !validToken(value.token) ||
      typeof value.createdAt !== 'number' ||
      !Number.isFinite(value.createdAt) ||
      Date.now() - value.createdAt > CONTINUATION_TTL_MS
    ) {
      clearInvitationContinuation();
      return null;
    }
    return { token: value.token, createdAt: value.createdAt };
  } catch {
    clearInvitationContinuation();
    return null;
  }
}

function validToken(value: string) {
  return /^[A-Za-z0-9_-]{32,256}$/.test(value);
}

export function persistInvitationContinuation() {
  if (!pendingToken) return false;
  try {
    window.sessionStorage.setItem(
      CONTINUATION_KEY,
      JSON.stringify({ token: pendingToken, createdAt: Date.now() }),
    );
    return true;
  } catch {
    return false;
  }
}

export function hasInvitationContinuation() {
  return Boolean(readContinuation());
}

export function clearInvitationContinuation() {
  try {
    window.sessionStorage.removeItem(CONTINUATION_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
}

export function captureInvitationToken() {
  if (window.location.pathname !== '/invitations/accept') return;
  const params = new URLSearchParams(window.location.search);
  const value = params.get('token');
  if (value !== null && validToken(value)) {
    pendingToken = value;
    clearInvitationContinuation();
  } else if (value === null) {
    pendingToken = readContinuation()?.token ?? null;
  } else {
    pendingToken = null;
    clearInvitationContinuation();
  }
  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname,
  );
  let meta = document.querySelector<HTMLMetaElement>('meta[name="referrer"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'referrer';
    document.head.appendChild(meta);
  }
  meta.content = 'no-referrer';
}
export function pendingInvitationToken() {
  return pendingToken ?? readContinuation()?.token ?? null;
}
export function clearInvitationToken() {
  pendingToken = null;
  clearInvitationContinuation();
}

export function clearPendingInvitationMemory() {
  pendingToken = null;
}
captureInvitationToken();
