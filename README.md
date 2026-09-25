# Surf Wala – Laundry Booking System

A web app for booking laundry time slots at **Surf Wala** (Arambol, Goa). Guests pick a date,
service and a free slot online; the staff manage all bookings in a password-protected admin
dashboard, and every booking is also copied automatically to a Google Sheet.


## Features

**Booking form (public)**
- Standard (next-day, 5 slots per day) and Express (same-day, 3 slots per day) service
- Live slot availability – already booked slots are shown as taken
- Options with surcharges (separate washing of whites, separate drying) and live price calculation
- Booking confirmation with a unique booking number and pick-up time

**Admin dashboard (password protected)**
- Bookings for any selected day with customer name, phone, service and slot
- Status workflow: *Pending → Ready for pick-up → Completed*
- Deleting a booking frees the slot again
- Daily statistics: used slots per service, expected and collected revenue

**Automation**
- Each new booking is sent to a Google Sheet via a Google Apps Script webhook (`google-apps-script.js`)

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers (REST API), Middleware for admin authentication |
| Database | PostgreSQL (Supabase) with Row Level Security |
| Integrations | Google Sheets via Google Apps Script |

## Architecture & security

- The browser never talks to the database directly – all reads and writes go through the API routes,
  which use a server-only Supabase key. Row Level Security blocks any direct public access.
- Price and booking number are calculated on the server, so they cannot be manipulated in the browser.
- Input validation on the server (date, service, slot range, name, phone number).
- A unique constraint on `(booking_date, service_type, slot_number)` prevents double booking,
  even when two people book the same slot at the same moment.
- Admin password is stored only in an environment variable; the session cookie is `HttpOnly`
  and contains only a hash.

## REST API

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/slots?date=&service=` | GET | public | Booked slot numbers (no customer data) |
| `/api/bookings` | POST | public | Create a booking |
| `/api/auth` · `/api/logout` | POST | public | Admin login / logout |
| `/api/admin/reservations?date=` | GET | admin | Bookings for a day |
| `/api/admin/reservations/[id]` | PATCH, DELETE | admin | Change status / delete booking |

## Project structure

```
app/
  page.tsx                 booking form
  admin/page.tsx           admin dashboard
  api/                     REST API (slots, bookings, auth, admin)
components/                booking form, slot grid, booking receipt
lib/
  booking-config.ts        capacities, prices, price calculation
  auth.ts                  admin session helpers
  supabase/admin.ts        server-only Supabase client
supabase/schema.sql        database table, constraints and RLS
google-apps-script.js      Google Sheets webhook
middleware.ts              protects /api/admin/*
```

## Getting started

Requirements: Node.js 20+, pnpm and a free Supabase project.

1. In Supabase open **SQL Editor** and run `supabase/schema.sql`.
2. Set up the project:

```bash
git clone https://github.com/Anti746/surfwala-laundry-booking.git
cd surfwala-laundry-booking
pnpm install
cp .env.local.example .env.local   # fill in your values
pnpm dev
```

- Booking form: <http://localhost:3000>
- Admin dashboard: <http://localhost:3000/admin>

3. Optional: set up the Google Sheets sync using the steps at the top of `google-apps-script.js`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_PASSWORD` | yes | Password for the admin dashboard |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Supabase service role key (server-side only) |
| `GOOGLE_SHEET_WEBHOOK_URL` | no | Google Apps Script web app URL |

## Screenshots

_Add screenshots of the booking form and the admin dashboard here._

## Author

**Antónia Krippnerová** – design and development (frontend, REST API, database, Google Sheets
integration). Built with the help of AI coding tools (v0.app).
