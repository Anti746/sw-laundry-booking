'use client'

import { useState, useEffect, useCallback } from 'react'
import { SlotGrid } from './slot-grid'
import { BookingReceipt, type ReceiptData } from './booking-receipt'
import { Loader2, WashingMachine } from 'lucide-react'
import {
  CAPACITY, PRICES, WHITES_SURCHARGE, DRYING_SURCHARGE, calculatePrice, todayString,
  type ServiceType, type DryingType,
} from '@/lib/booking-config'

// ─── component ────────────────────────────────────────────────────────────────
export function BookingForm() {
  // Form state
  const [date, setDate] = useState(todayString())
  const [service, setService] = useState<ServiceType>('standard')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whitesOnly, setWhitesOnly] = useState(false)
  const [dryingType, setDryingType] = useState<DryingType>('mixed')

  // Loading / data
  const [bookedSlots, setBookedSlots] = useState<number[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Confirmation
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  // ── fetch bookings for selected date + service ──
  const fetchBookings = useCallback(async () => {
    setLoadingSlots(true)
    setSelectedSlot(null)
    setError(null)
    try {
      const res = await fetch(`/api/slots?date=${date}&service=${service}`)
      if (!res.ok) throw new Error('Failed to load slots')
      const data: { booked: number[] } = await res.json()
      setBookedSlots(data.booked)
    } catch {
      setError('Could not load slot availability. Please try again.')
    } finally {
      setLoadingSlots(false)
    }
  }, [date, service])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // ── submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedSlot) { setError('Please select an available slot.'); return }
    if (!customerName.trim()) { setError('Please enter your name.'); return }
    if (!phoneNumber.trim()) { setError('Please enter your phone number.'); return }

    setSubmitting(true)

    // The server validates the data, calculates the price, saves the booking
    // to the database and forwards it to Google Sheets.
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          service,
          slot: selectedSlot,
          customerName: customerName.trim(),
          phoneNumber: phoneNumber.trim(),
          whitesOnly,
          dryingType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Booking failed. Please try again.')

      // Refresh slot list so the just-booked slot is immediately marked as taken
      await fetchBookings()
      setReceipt(data as ReceiptData)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setDate(todayString())
    setService('standard')
    setSelectedSlot(null)
    setCustomerName('')
    setPhoneNumber('')
    setWhitesOnly(false)
    setDryingType('mixed')
    setReceipt(null)
    setError(null)
  }

  if (receipt) {
    return <BookingReceipt receipt={receipt} onNewBooking={resetForm} />
  }

  const maxSlots = CAPACITY[service]
  const allBooked = bookedSlots.length >= maxSlots
  const price = calculatePrice(service, whitesOnly, dryingType)

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-primary px-4 pt-12 pb-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-primary-foreground/20 rounded-xl p-2">
              <WashingMachine className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-widest">Surf Wala</p>
              <h1 className="text-primary-foreground font-bold text-xl leading-tight">Laundry Booking</h1>
            </div>
          </div>
          <p className="text-primary-foreground/70 text-sm mt-3">
            Book your laundry slot — drop off anytime during working hours.
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Date */}
          <FormCard title="1. Pick a Date">
            <input
              type="date"
              value={date}
              min={todayString()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </FormCard>

          {/* Service type */}
          <FormCard title="2. Choose Service">
            <div className="grid grid-cols-2 gap-3">
              {(['standard', 'express'] as ServiceType[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => { setService(s); setSelectedSlot(null) }}
                  className={[
                    'rounded-xl border-2 p-4 text-left transition-all',
                    service === s
                      ? 'border-primary bg-accent'
                      : 'border-border bg-card hover:border-primary/40',
                  ].join(' ')}
                >
                  <p className={['font-semibold text-sm capitalize', service === s ? 'text-primary' : 'text-foreground'].join(' ')}>
                    {s}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s === 'standard' ? 'Next day after 5 PM' : 'Same day'}
                  </p>
                  <p className="text-xs font-semibold text-primary mt-1">
                    Rs {PRICES[s]}
                  </p>
                </button>
              ))}
            </div>

            {service === 'standard' && (
              <p className="mt-3 text-xs text-primary font-medium bg-accent/60 rounded-lg px-3 py-2">
                Pick-up: next day after 5:00 PM
              </p>
            )}
            {service === 'express' && (
              <p className="mt-3 text-xs text-primary font-medium bg-accent/60 rounded-lg px-3 py-2">
                Pick-up: same day after drop-off
              </p>
            )}
          </FormCard>

          {/* Slots */}
          <FormCard title="3. Select a Slot">
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Checking availability...</span>
              </div>
            ) : allBooked ? (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-4 text-center">
                <p className="text-red-600 text-sm font-medium">
                  All slots for this service are fully booked for the selected day. Please choose another date.
                </p>
              </div>
            ) : (
              <SlotGrid
                maxSlots={maxSlots}
                bookedSlots={bookedSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />
            )}
          </FormCard>

          {/* Washing type */}
          <FormCard title="4. Washing Type">
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'mixed',    label: 'Mixed',            sub: 'Whites & colours together', extra: 0 },
                { value: 'separate', label: 'Separate Washing', sub: 'Whites washed separately',  extra: WHITES_SURCHARGE },
              ] as const).map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setWhitesOnly(opt.value === 'separate')}
                  className={[
                    'rounded-xl border-2 p-4 text-left transition-all',
                    (whitesOnly ? 'separate' : 'mixed') === opt.value
                      ? 'border-primary bg-accent'
                      : 'border-border bg-card hover:border-primary/40',
                  ].join(' ')}
                >
                  <p className={['font-semibold text-sm', (whitesOnly ? 'separate' : 'mixed') === opt.value ? 'text-primary' : 'text-foreground'].join(' ')}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                  <p className="text-xs font-semibold text-primary mt-1">
                    {opt.extra === 0 ? 'Included' : `+Rs ${opt.extra}`}
                  </p>
                </button>
              ))}
            </div>
          </FormCard>

          {/* Drying type */}
          <FormCard title="5. Drying Type">
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'mixed',    label: 'Mixed',    sub: 'Cotton & synthetic together',    extra: 0 },
                { value: 'separate', label: 'Separate', sub: 'Cotton & synthetic separately',  extra: DRYING_SURCHARGE },
              ] as const).map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setDryingType(opt.value)}
                  className={[
                    'rounded-xl border-2 p-4 text-left transition-all',
                    dryingType === opt.value
                      ? 'border-primary bg-accent'
                      : 'border-border bg-card hover:border-primary/40',
                  ].join(' ')}
                >
                  <p className={['font-semibold text-sm', dryingType === opt.value ? 'text-primary' : 'text-foreground'].join(' ')}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                  <p className="text-xs font-semibold text-primary mt-1">
                    {opt.extra === 0 ? 'Included' : `+Rs ${opt.extra}`}
                  </p>
                </button>
              ))}
            </div>
          </FormCard>

          {/* Contact */}
          <FormCard title="6. Your Details">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block" htmlFor="customer-name">
                  Full Name
                </label>
                <input
                  id="customer-name"
                  type="text"
                  placeholder="e.g. Ahmed Khan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
            </div>
          </FormCard>

          {/* Summary strip */}
          {selectedSlot && (
            <div className="bg-accent rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Slot {selectedSlot} &bull; {service === 'standard' ? 'Standard' : 'Express'} &bull; {whitesOnly ? 'Separate Washing' : 'Mixed'} &bull; Drying: {dryingType === 'separate' ? 'Separate' : 'Mixed'}
                </p>
                <p className="text-sm font-semibold text-foreground">{date}</p>
              </div>
              <p className="text-xl font-bold text-primary">Rs {price}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || allBooked || loadingSlots}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Confirming...' : 'Confirm Booking'}
          </button>

          <p className="text-center text-xs text-muted-foreground pb-2">
            Location: Surf Wala &bull; No payment required now
          </p>
        </form>
      </div>
    </div>
  )
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm px-4 py-4">
      <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
      {children}
    </div>
  )
}
