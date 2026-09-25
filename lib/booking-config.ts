/** Shared business rules – used by the booking form and validated again on the server. */
export type ServiceType = 'standard' | 'express'
export type DryingType = 'mixed' | 'separate'
export type Status = 'pending' | 'ready_for_pickup' | 'completed'

export const CAPACITY: Record<ServiceType, number> = { standard: 5, express: 3 }
export const PRICES: Record<ServiceType, number> = { standard: 350, express: 500 }
export const WHITES_SURCHARGE = 100
export const DRYING_SURCHARGE = 100

export function calculatePrice(service: ServiceType, whitesOnly: boolean, dryingType: DryingType): number {
  return PRICES[service] + (whitesOnly ? WHITES_SURCHARGE : 0) + (dryingType === 'separate' ? DRYING_SURCHARGE : 0)
}

/** Today's date as YYYY-MM-DD in local time (toISOString would shift the date across UTC midnight). */
export function todayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
