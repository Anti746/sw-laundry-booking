'use client'

import { useState, useEffect, useCallback } from 'react'
import { todayString, CAPACITY, type Status } from '@/lib/booking-config'
import { Loader2, RefreshCw, Trash2, WashingMachine, LogOut, Calendar } from 'lucide-react'

// ─── config ───────────────────────────────────────────────────────────────────

// ─── types ────────────────────────────────────────────────────────────────────

interface Reservation {
  id: string
  booking_number: string
  customer_name: string
  phone_number: string
  service_type: 'standard' | 'express'
  price: number
  slot_number: number
  status: Status
  created_at: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<Status, string> = {
  pending: 'Pending',
  ready_for_pickup: 'Ready for Pick-up',
  completed: 'Completed',
}

const STATUS_COLORS: Record<Status, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ready_for_pickup: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
}

// ─── admin page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  // null = checking the session, false = show login, true = show dashboard
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  // Check whether a valid admin session cookie already exists
  useEffect(() => {
    fetch(`/api/admin/reservations?date=${todayString()}`)
      .then((res) => setAuthed(res.ok))
      .catch(() => setAuthed(false))
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setSigningIn(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      })
      if (res.ok) {
        setAuthed(true)
        setPasswordError(false)
        setPasswordInput('')
      } else {
        setPasswordError(true)
      }
    } finally {
      setSigningIn(false)
    }
  }

  const handleLogout = useCallback(async () => {
    await fetch('/api/logout', { method: 'POST' })
    setAuthed(false)
  }, [])

  if (authed === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <WashingMachine className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Surf Wala Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter the admin password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block" htmlFor="admin-pw">
                Password
              </label>
              <input
                id="admin-pw"
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false) }}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-xs mt-1.5">Incorrect password. Please try again.</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition"
            >
              {signingIn ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <AdminDashboard onLogout={handleLogout} />
}

// ─── dashboard ────────────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [date, setDate] = useState(todayString())
  const [rows, setRows] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/reservations?date=${date}`)
      if (res.status === 401) { onLogout(); return }
      if (!res.ok) throw new Error('Failed to load')
      setRows((await res.json()) as Reservation[])
    } catch {
      setError('Could not load bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [date, onLogout])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  async function handleStatusChange(id: string, newStatus: Status) {
    setUpdatingId(id)
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const updateError = !res.ok

    if (!updateError) {
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r))
    }
    setUpdatingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this booking? This will free up the slot.')) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/reservations/${id}`, { method: 'DELETE' })
    const deleteError = !res.ok

    if (!deleteError) {
      setRows((prev) => prev.filter((r) => r.id !== id))
    }
    setDeletingId(null)
  }

  // ── summary counts ──
  const totalBookings = rows.length
  const standardCount = rows.filter((r) => r.service_type === 'standard').length
  const expressCount = rows.filter((r) => r.service_type === 'express').length
  const totalRevenue = rows.filter((r) => r.status === 'completed').reduce((sum, r) => sum + r.price, 0)
  const expectedRevenue = rows.reduce((sum, r) => sum + r.price, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-4 pt-10 pb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 rounded-xl p-2">
              <WashingMachine className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-widest">Surf Wala</p>
              <h1 className="text-primary-foreground font-bold text-lg leading-tight">Admin Dashboard</h1>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-primary-foreground/80 hover:text-primary-foreground text-xs font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Date selector */}
        <div className="bg-card rounded-2xl border border-border shadow-sm px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            Viewing bookings for:
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
            <button
              onClick={fetchReservations}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-accent transition disabled:opacity-50"
            >
              <RefreshCw className={['w-4 h-4', loading ? 'animate-spin' : ''].join(' ')} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Bookings" value={String(totalBookings)} />
          <StatCard label="Standard Slots" value={`${standardCount} / ${CAPACITY.standard}`} />
          <StatCard label="Express Slots" value={`${expressCount} / ${CAPACITY.express}`} />
          <StatCard label="Expected Revenue" value={`Rs ${expectedRevenue}`} sub={totalRevenue > 0 ? `Collected Rs ${totalRevenue}` : undefined} />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Bookings
              {!loading && <span className="ml-2 text-xs text-muted-foreground font-normal">({rows.length} total)</span>}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-sm">No bookings found for this date.</p>
            </div>
          ) : (
            /* scrollable on mobile */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Booking #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Service</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Slot</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{row.booking_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-foreground">{row.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{row.phone_number}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={[
                          'inline-block px-2 py-0.5 rounded-full text-xs font-semibold border',
                          row.service_type === 'express'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-teal-100 text-teal-800 border-teal-200',
                        ].join(' ')}>
                          {row.service_type === 'standard' ? 'Standard' : 'Express'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">#{row.slot_number}</td>
                      <td className="px-4 py-3 text-foreground font-semibold whitespace-nowrap">Rs {row.price}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="relative">
                          {updatingId === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <select
                              value={row.status}
                              onChange={(e) => handleStatusChange(row.id, e.target.value as Status)}
                              className={[
                                'text-xs font-semibold border rounded-full px-2 py-1 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition',
                                STATUS_COLORS[row.status],
                              ].join(' ')}
                            >
                              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(row.id)}
                          disabled={deletingId === row.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition text-xs font-medium disabled:opacity-50"
                        >
                          {deletingId === row.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Surf Wala Admin
        </p>
      </div>
    </div>
  )
}

// ── stat card ──
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm px-4 py-4">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-bold text-primary mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}
