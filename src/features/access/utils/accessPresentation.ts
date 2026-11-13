import type { AccessProfile } from '../types/access.types';

export function accessName(profile: AccessProfile | null) {
  return profile?.displayName?.trim() || 'Usuario sin nombre';
}
