export function resolveMediaUrlFromBase(
  value: string | null | undefined,
  apiBaseUrl: string,
  browserOrigin: string,
): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  // CHANGE: URL API production memakai path same-origin `/api/v1`. Berikan
  // origin browser sebagai base agar URL media relatif tidak melempar
  // `TypeError: Invalid URL` ketika dirender pada Web Admin production.
  const gatewayOrigin = new URL(apiBaseUrl, browserOrigin).origin;
  return new URL(value.startsWith('/') ? value : `/${value}`, gatewayOrigin).toString();
}
