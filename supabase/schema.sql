-- Supabase Schema for SentinelOps & checkout-service
-- Run this in the Supabase SQL Editor to set up all tables including incident persistent memory.

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    is_guest boolean default false,
    created_at timestamptz default now()
);

-- Orders table
create table if not exists orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete set null,
    is_guest boolean default false,
    currency text not null,
    total numeric not null,
    status text not null default 'completed',
    created_at timestamptz default now()
);

-- Order items table
create table if not exists order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references orders(id) on delete cascade not null,
    sku text not null,
    qty integer not null,
    price numeric not null,
    created_at timestamptz default now()
);

-- Incidents table (Persistent Memory & Command Center for SentinelOps)
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

-- Indexes for quick lookups
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_incidents_created_at on incidents(created_at desc);
