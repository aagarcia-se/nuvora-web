// Ephemeral callback token. No URL/history state, Query key or persistent storage.
let pendingToken: string | null = null;
export function captureInvitationToken() {
  if (window.location.pathname !== '/invitations/accept') return;
  const params = new URLSearchParams(window.location.search);
  const value = params.get('token');
  if (value && /^[A-Za-z0-9_-]{32,256}$/.test(value)) pendingToken = value;
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
  return pendingToken;
}
export function clearInvitationToken() {
  pendingToken = null;
}
captureInvitationToken();
