import type { Entity } from '../types/entity.types';
export const normalizeTaxId = (value: string) =>
  value.replace(/\s+/g, '').toUpperCase();
export const validTaxId = (value: string) => /^[A-Z0-9-]{3,64}$/.test(value);
export function entityTaxLabel(entity: Entity) {
  if (entity.taxId) return entity.taxId;
  return entity.permissions.canManage
    ? 'Sin NIT registrado'
    : 'NIT no disponible';
}
