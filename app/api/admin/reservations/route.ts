import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// GET /api/admin/reservations?date=YYYY-MM-DD  (admin only – protected by middleware)
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date') ?? ''
  if (!DATE_RE.test(date)) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('reservations')
      .select('id, booking_number, customer_name, phone_number, service_type, price, slot_number, status, created_at')
      .eq('booking_date', date)
      .order('created_at', { ascending: true })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('GET /api/admin/reservations failed:', err)
    return NextResponse.json({ error: 'Could not load bookings' }, { status: 500 })
  }
}
