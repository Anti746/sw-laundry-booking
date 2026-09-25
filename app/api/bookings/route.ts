import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CAPACITY, calculatePrice, type DryingType, type ServiceType } from '@/lib/booking-config'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function generateBookingNumber(date: string) {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SW-${date.replace(/-/g, '')}-${rand}`
}

/** Sends the booking to Google Sheets (optional). A failure here never blocks the booking. */
async function sendToGoogleSheet(params: Record<string, string>) {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(`${url}?${new URLSearchParams(params).toString()}`)
  } catch (err) {
    console.error('Google Sheet webhook failed:', err)
  }
}

// POST /api/bookings – creates a reservation. Price and booking number are
// calculated on the server, so they cannot be manipulated from the browser.
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const date = String(body.date ?? '')
  const service = body.service as ServiceType
  const slot = Number(body.slot)
  const customerName = String(body.customerName ?? '').trim()
  const phoneNumber = String(body.phoneNumber ?? '').trim()
  const whitesOnly = body.whitesOnly === true
  const dryingType: DryingType = body.dryingType === 'separate' ? 'separate' : 'mixed'

  if (!DATE_RE.test(date)) return NextResponse.json({ error: 'Invalid date.' }, { status: 400 })
  if (service !== 'standard' && service !== 'express') return NextResponse.json({ error: 'Invalid service.' }, { status: 400 })
  if (!Number.isInteger(slot) || slot < 1 || slot > CAPACITY[service]) return NextResponse.json({ error: 'Invalid slot.' }, { status: 400 })
  if (!customerName || customerName.length > 100) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  if (!/^[+\d][\d\s-]{6,19}$/.test(phoneNumber)) return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 })

  const price = calculatePrice(service, whitesOnly, dryingType)
  const bookingNumber = generateBookingNumber(date)

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('reservations').insert({
      booking_number: bookingNumber,
      booking_date: date,
      service_type: service,
      weight_category: whitesOnly ? 'separate' : 'mixed',
      drying_type: dryingType,
      price,
      customer_name: customerName,
      phone_number: phoneNumber,
      slot_number: slot,
      location: 'Surf Wala',
    })
    if (error) {
      // 23505 = unique violation → someone booked the same slot a moment earlier
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This slot was just booked. Please choose another one.' }, { status: 409 })
      }
      throw error
    }
  } catch (err) {
    console.error('POST /api/bookings failed:', err)
    return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 })
  }

  await sendToGoogleSheet({
    bookingNumber,
    bookingDate: date,
    customerName,
    phoneNumber,
    serviceType: service === 'standard' ? 'Standard' : 'Express',
    slotNumber: String(slot),
    washing: whitesOnly ? 'Separate' : 'Mixed',
    drying: dryingType === 'separate' ? 'Separate (Cotton & Synthetic)' : 'Mixed',
    price: `Rs ${price}`,
  })

  return NextResponse.json({
    bookingNumber,
    bookingDate: date,
    serviceType: service,
    price,
    slotNumber: slot,
    customerName,
    phoneNumber,
    whitesOnly,
    dryingType,
  })
}
