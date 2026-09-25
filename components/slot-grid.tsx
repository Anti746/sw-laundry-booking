'use client'

interface SlotGridProps {
  maxSlots: number
  bookedSlots: number[]
  selectedSlot: number | null
  onSelectSlot: (slot: number) => void
}

export function SlotGrid({ maxSlots, bookedSlots, selectedSlot, onSelectSlot }: SlotGridProps) {
  const bookedSet = new Set(bookedSlots)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Select a Slot</p>
        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
          Slots filled: {bookedSlots.length}/{maxSlots}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: maxSlots }, (_, i) => i + 1).map((slot) => {
          const isBooked = bookedSet.has(slot)
          const isSelected = selectedSlot === slot

          return (
            <button
              key={slot}
              type="button"
              disabled={isBooked}
              onClick={() => !isBooked && onSelectSlot(slot)}
              aria-label={isBooked ? `Slot ${slot} — booked` : `Slot ${slot} — available`}
              className={[
                'relative rounded-xl py-4 text-sm font-semibold transition-all duration-150 border-2',
                isBooked
                  ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed'
                  : isSelected
                    ? 'bg-primary border-primary text-primary-foreground shadow-md scale-[1.03]'
                    : 'bg-green-50 border-green-200 text-green-700 hover:border-primary hover:bg-accent cursor-pointer',
              ].join(' ')}
            >
              <span className="block">Slot {slot}</span>
              <span className={[
                'text-xs font-normal mt-0.5 block',
                isBooked ? 'text-red-400' : isSelected ? 'text-primary-foreground/80' : 'text-green-600',
              ].join(' ')}>
                {isBooked ? 'Booked' : 'Available'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          <span className="text-xs text-muted-foreground">Booked</span>
        </div>
      </div>
    </div>
  )
}
