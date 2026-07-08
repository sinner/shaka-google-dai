/** Strip trailing slashes from Vite `BASE_URL` before passing to Solid Router. */
export function normalizeRouterBase(baseUrl: string): string {
  if (!baseUrl || baseUrl === '/') return ''
  return baseUrl.replace(/\/+$/, '')
}

/** Collapse duplicate slashes in a pathname (e.g. `/repo//page` → `/repo/page`). */
export function normalizeAppPath(pathname: string): string {
  return pathname.replace(/\/{2,}/g, '/')
}
