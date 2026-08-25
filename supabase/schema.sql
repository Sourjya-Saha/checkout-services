-- Supabase Schema for checkout-service
-- Run this in the Supabase SQL Editor to set up the tables.

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

-- Indexes for quick lookups
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_order_items_order_id on order_items(order_id);
