import type { WorkspaceRole } from '../types/workspace.types';

export const workspaceRoles: Record<WorkspaceRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  viewer: 'Solo lectura',
};

export function workspaceSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 160)
    .replace(/^-+|-+$/g, '');
}
export function validateWorkspace(name: string, slug: string) {
  return {
    name:
      name.trim().length < 2 || name.trim().length > 160
        ? 'Usa entre 2 y 160 caracteres para el nombre.'
        : '',
    slug:
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160
        ? 'Usa minúsculas, números y guiones entre palabras, hasta 160 caracteres.'
        : '',
  };
}
export function initials(name: string) {
  return (
    name
      .split('@')[0]
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => Array.from(part)[0] ?? '')
      .join('')
      .toUpperCase() || 'N'
  );
}
export function safeAvatar(value: string | null | undefined) {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Sin fecha'
    : new Intl.DateTimeFormat('es-GT', {
        dateStyle: 'medium',
        timeZone: 'America/Guatemala',
      }).format(date);
}
