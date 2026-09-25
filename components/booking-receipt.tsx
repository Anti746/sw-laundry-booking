'use client'

import { CheckCircle } from 'lucide-react'

export interface ReceiptData {
  bookingNumber: string
  bookingDate: string
  serviceType: 'standard' | 'express'
  price: number
  slotNumber: number
  customerName: string
  phoneNumber: string
  whitesOnly: boolean
  dryingType: 'mixed' | 'separate'
}

interface BookingReceiptProps {
  receipt: ReceiptData
  onNewBooking: () => void
}

const serviceLabel = (s: string) => (s === 'standard' ? 'Standard' : 'Express')

const pickupInfo = (s: string, date: string) => {
  if (s === 'express') return 'Ready today after drop-off'
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  return `Ready ${next.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })} after 5:00 PM`
}

export function BookingReceipt({ receipt, onNewBooking }: BookingReceiptProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-10 px-4 pb-10">
      <div className="w-full max-w-md">
        {/* Success header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-4">
            <CheckCircle className="w-9 h-9 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Booking Confirmed!</h1>
          <p className="text-muted-foreground text-sm mt-1">Your laundry slot has been reserved.</p>
        </div>

        {/* Screenshot reminder — top */}
        <div className="mb-4 bg-yellow-400 border-4 border-yellow-500 rounded-xl px-4 py-4 text-center shadow-lg animate-pulse">
          <p className="text-black font-extrabold text-xl leading-snug">
            📸 Take a screenshot of this confirmation!
          </p>
          <p className="text-black/80 text-sm font-semibold mt-1">
            You will need to show it at the location.
          </p>
        </div>

        {/* Receipt card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Brand header stripe */}
          <div className="bg-primary px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider">Surf Wala</p>
                <p className="text-primary-foreground font-bold text-lg">Laundry Service</p>
              </div>
              <div className="text-right">
                <p className="text-primary-foreground/70 text-xs">Booking #</p>
                <p className="text-primary-foreground font-mono font-bold text-sm">{receipt.bookingNumber}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-5 py-4 space-y-0 divide-y divide-border">
            <ReceiptRow label="Customer" value={receipt.customerName} />
            <ReceiptRow label="Phone" value={receipt.phoneNumber} />
            <ReceiptRow label="Date" value={new Date(receipt.bookingDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
            <ReceiptRow label="Service" value={serviceLabel(receipt.serviceType)} />
            <ReceiptRow label="Washing" value={receipt.whitesOnly ? 'Separate Washing' : 'Mixed'} />
            <ReceiptRow label="Drying" value={receipt.dryingType === 'separate' ? 'Separate (Cotton & Synthetic)' : 'Mixed'} />
            <ReceiptRow label="Slot" value={`Slot ${receipt.slotNumber}`} />
            <ReceiptRow label="Pick-up" value={pickupInfo(receipt.serviceType, receipt.bookingDate)} highlight />
            <ReceiptRow label="Location" value="Surf Wala" />
          </div>

          {/* Price footer */}
          <div className="px-5 py-4 bg-accent/40 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total Amount</span>
            <span className="text-2xl font-bold text-primary">Rs {receipt.price}</span>
          </div>
        </div>

        {/* Drop-off note */}
        <div className="mt-4 bg-accent/60 border border-border rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-foreground font-medium">
            🧺 Please bring your laundry after <span className="text-primary font-bold">5:00 PM</span>.
          </p>
          <p className="text-xs text-muted-foreground mt-1">No payment required now — pay at drop-off.</p>
        </div>

        <button
          onClick={onNewBooking}
          className="mt-6 w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Book Another Slot
        </button>
      </div>
    </div>
  )
}

function ReceiptRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start py-3 gap-4">
      <span className="text-xs text-muted-foreground font-medium shrink-0 pt-0.5">{label}</span>
      <span className={['text-sm text-right', highlight ? 'text-primary font-semibold' : 'text-foreground font-medium'].join(' ')}>
        {value}
      </span>
    </div>
  )
}
