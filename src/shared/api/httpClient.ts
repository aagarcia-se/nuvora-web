import axios from 'axios';
import { API_PREFIX, env } from '@/shared/config/env';

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl ? `${env.apiBaseUrl}${API_PREFIX}/` : undefined,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});
