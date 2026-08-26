-- ==============================================================================
-- SentinelOps & checkout-service: Complete Supabase Database Schema
-- Copy and paste this ENTIRE block into your Supabase SQL Editor and click "Run".
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Users Table
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    name text default 'Customer',
    password_hash text,
    address text,
    is_guest boolean default false,
    created_at timestamptz default now()
);

-- 3. Orders Table
create table if not exists orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete set null,
    is_guest boolean default false,
    currency text not null,
    total numeric not null,
    status text not null default 'completed',
    created_at timestamptz default now()
);

-- 4. Order Items Table
create table if not exists order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references orders(id) on delete cascade not null,
    sku text not null,
    qty integer not null,
    price numeric not null,
    created_at timestamptz default now()
);

-- 5. Incidents Table (SentinelOps Persistent Memory & Command Center)
create table if not exists incidents (
    id text primary key,
    title text not null,
    service text not null default 'checkout-service',
    root_cause text not null,
    evidence_summary text not null,
    verification_result text not null,
    approval_record text not null,
    pr_link text,
    resolution_status text not null default 'resolved',
    created_at timestamptz default now()
);

-- 6. Indexes for Performance
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_incidents_created_at on incidents(created_at desc);

-- 7. Disable Row Level Security (RLS) to ensure full read/write access for demo APIs
alter table users disable row level security;
alter table orders disable row level security;
alter table order_items disable row level security;
alter table incidents disable row level security;

-- 8. Grant full permissions to anon and authenticated roles
grant all on table users to anon, authenticated, service_role;
grant all on table orders to anon, authenticated, service_role;
grant all on table order_items to anon, authenticated, service_role;
grant all on table incidents to anon, authenticated, service_role;
