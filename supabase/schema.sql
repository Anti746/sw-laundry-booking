-- Surf Wala Laundry – database schema (PostgreSQL / Supabase)
-- Run this in Supabase → SQL Editor.

create table if not exists public.reservations (
  id              uuid primary key default gen_random_uuid(),
  booking_number  text not null unique,
  booking_date    date not null,
  service_type    text not null check (service_type in ('standard', 'express')),
  slot_number     integer not null check (slot_number > 0),
  weight_category text not null default 'mixed' check (weight_category in ('mixed', 'separate')),
  drying_type     text not null default 'mixed' check (drying_type in ('mixed', 'separate')),
  price           integer not null check (price >= 0),
  customer_name   text not null,
  phone_number    text not null,
  location        text,
  status          text not null default 'pending'
                  check (status in ('pending', 'ready_for_pickup', 'completed')),
  created_at      timestamptz not null default now(),

  -- one slot can be booked only once per day and service (prevents double booking)
  constraint reservations_unique_slot unique (booking_date, service_type, slot_number)
);

create index if not exists reservations_booking_date_idx on public.reservations (booking_date);

-- Row Level Security: no public access at all. The app reads and writes only
-- through its API routes using the service role key (which bypasses RLS).
alter table public.reservations enable row level security;
