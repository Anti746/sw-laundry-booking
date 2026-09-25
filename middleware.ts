import { type NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, getAdminSessionToken } from '@/lib/auth'

// Admin API endpoints (customer names, phone numbers, status changes, deleting)
// require a valid admin session. The public booking endpoints stay open.
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    const session = request.cookies.get(ADMIN_COOKIE)?.value
    const expected = await getAdminSessionToken()
    if (!expected || session !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
