function origin(value: string | undefined) {
  try {
    const url = new URL(value?.trim() || '');
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}
export const env = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Nuvora',
  apiBaseUrl: origin(import.meta.env.VITE_API_BASE_URL),
  supabaseUrl: origin(import.meta.env.VITE_SUPABASE_URL),
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim(),
};
export const authConfigured = Boolean(
  env.apiBaseUrl &&
  env.supabaseUrl &&
  env.supabaseKey?.startsWith('sb_publishable_'),
);
