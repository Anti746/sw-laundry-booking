import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// GET /api/slots?date=YYYY-MM-DD&service=standard|express
// Public – returns only the numbers of booked slots, no customer data.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? ''
  const service = searchParams.get('service') ?? ''

  if (!DATE_RE.test(date) || (service !== 'standard' && service !== 'express')) {
    return NextResponse.json({ error: 'Invalid date or service' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('reservations')
      .select('slot_number')
      .eq('booking_date', date)
      .eq('service_type', service)
    if (error) throw error
    return NextResponse.json({ booked: (data ?? []).map((r) => r.slot_number as number) })
  } catch (err) {
    console.error('GET /api/slots failed:', err)
    return NextResponse.json({ error: 'Could not load slots' }, { status: 500 })
  }
}
