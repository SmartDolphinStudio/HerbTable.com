/** Cookie helpers for client-side persistence. */

export interface CookieOptions {
  days?: number
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

/** Read a cookie by name. */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(name).replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

/** Write a cookie with optional expiration and flags. */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return
  const { days = 365, path = '/', domain, secure, sameSite } = options
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  cookie += `; expires=${expires.toUTCString()}; path=${path}`
  if (domain) cookie += `; domain=${domain}`
  if (secure) cookie += `; secure`
  if (sameSite) cookie += `; samesite=${sameSite.toLowerCase()}`
  document.cookie = cookie
}

/** Delete a cookie. */
export function deleteCookie(name: string, path = '/', domain?: string): void {
  if (typeof document === 'undefined') return
  let cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
  if (domain) cookie += `; domain=${domain}`
  document.cookie = cookie
}
