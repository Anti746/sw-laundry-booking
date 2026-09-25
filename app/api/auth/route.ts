import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, getAdminSessionToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    }
    const token = await getAdminSessionToken()
    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_COOKIE, token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 hours
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
