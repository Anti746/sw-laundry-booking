/**
 * Admin authentication helpers.
 * The password comes from the ADMIN_PASSWORD environment variable. The session
 * cookie stores only a SHA-256 hash, never the password itself. Web Crypto works
 * in both the Edge runtime (middleware) and Node.js (API routes).
 */
export const ADMIN_COOKIE = 'laundry_admin_session'

export async function getAdminSessionToken(): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return null
  const data = new TextEncoder().encode(`surfwala-laundry-admin:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
