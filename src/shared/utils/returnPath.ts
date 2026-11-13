// Only known internal destinations may survive authentication.
export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string') return '/';
  if (value === '/' || value === '/account') return value;
  const uuid =
    '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  if (
    new RegExp(
      `^/client/entities/${uuid}\\?workspaceId=${uuid}(?:&view=documents|&draft=${uuid})?$`,
    ).test(value)
  )
    return value;
  return new RegExp(`^/workspaces/${uuid}/clients(?:/${uuid})?$`).test(value)
    ? value
    : '/';
}
