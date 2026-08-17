-- =========================================================
-- CHAIHOLIC — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query
-- =========================================================

-- 1. Profiles (extends built-in auth.users with name/phone)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can upsert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- 2. Reservations (table bookings — guests or logged-in users)
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  phone text not null,
  date date not null,
  time time not null,
  guests int not null check (guests between 1 and 20),
  notes text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.reservations enable row level security;

-- Anyone (including anonymous visitors) can create a reservation
create policy "Anyone can request a reservation"
  on public.reservations for insert
  with check (true);

-- Logged-in users can see their own past reservations
create policy "Users can view their own reservations"
  on public.reservations for select
  using (auth.uid() = user_id);


-- 3. Inquiries (contact messages + catering / franchise / event / feedback)
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text,
  phone text,
  type text not null default 'general'
    check (type in ('general','catering','event','franchise','feedback','other')),
  message text not null,
  status text not null default 'new' check (status in ('new','read','resolved')),
  created_at timestamptz not null default now()
);

alter table public.inquiries enable row level security;

create policy "Anyone can submit an inquiry"
  on public.inquiries for insert
  with check (true);

create policy "Users can view their own inquiries"
  on public.inquiries for select
  using (auth.uid() = user_id);


-- =========================================================
-- Owner / staff access
-- The policies above only let people see their OWN rows.
-- To let the cafe owner see every reservation and inquiry,
-- either:
--   a) view/manage data from the Supabase Table Editor
--      (uses your project's service role, bypasses RLS), or
--   b) create a staff role and add policies such as:
--
-- create policy "Staff can view all reservations"
--   on public.reservations for select
--   using (auth.jwt() ->> 'role' = 'staff');
-- =========================================================
