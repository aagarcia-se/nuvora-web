// Only known internal destinations may survive authentication.
export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string') return '/';
  if (value === '/' || value === '/account') return value;
  const uuid =
    '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  const period = '(?!0000)\\d{4}-(?:0[1-9]|1[0-2])';
  if (
    new RegExp(
      `^/client/entities/${uuid}\\?workspaceId=${uuid}(?:&view=(?:documents|summary)|&draft=${uuid}|&document=${uuid})?(?:&period=${period})?$`,
    ).test(value)
  )
    return value;
  return new RegExp(
    `^/workspaces/${uuid}/clients(?:/${uuid}(?:/documents(?:\\?(?:document=${uuid}|view=summary)(?:&period=${period})?|\\?period=${period})?)?)?$`,
  ).test(value)
    ? value
    : '/';
}
