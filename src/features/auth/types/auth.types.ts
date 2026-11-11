export interface Identity {
  id: string;
  email?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthState {
  status: 'loading' | 'anonymous' | 'authenticated' | 'error';
  user: Identity | null;
  error: string | null;
}
