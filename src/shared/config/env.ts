export const env = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Nuvora',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || undefined,
};
