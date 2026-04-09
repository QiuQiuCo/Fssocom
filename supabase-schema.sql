-- =============================================================
-- Fssocom Inventory Management — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- -------------------------------------------------------------
-- 1. INVENTORY TABLE
-- -------------------------------------------------------------
create table if not exists inventory (
  id           bigserial primary key,
  sku          text unique not null,
  name         text not null,
  barcode      text,
  category     text,
  quantity     integer default 0,
  min_quantity integer default 0,
  price        numeric(10,2) default 0,
  cost         numeric(10,2) default 0,
  supplier     text,
  location     text,
  description  text,
  updated_at   timestamptz default now()
);

-- -------------------------------------------------------------
-- 2. TRANSACTIONS TABLE
-- -------------------------------------------------------------
create table if not exists transactions (
  id         bigserial primary key,
  item_name  text,
  type       text,        -- 'add' | 'remove' | 'set'
  quantity   integer,
  note       text,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------
-- 3. USERS TABLE
--    Managed by the app (not Supabase Auth).
--    Passwords are bcrypt hashed.
--    expires_at: NULL means the account never expires.
--    Expired accounts are auto-deleted by the trigger below.
-- -------------------------------------------------------------
create table if not exists users (
  id                  bigserial primary key,
  username            text unique not null,
  password            text not null,          -- bcrypt hash
  role                text default 'staff',   -- 'admin' | 'staff'
  must_change_password boolean default true,
  expires_at          timestamptz,            -- NULL = never expires
  created_at          timestamptz default now()
);

-- -------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- -------------------------------------------------------------
alter table inventory   enable row level security;
alter table transactions enable row level security;
alter table users        enable row level security;

-- Allow anon key to read/write inventory
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'inventory' and policyname = 'anon full access inventory'
  ) then
    execute 'create policy "anon full access inventory" on inventory for all to anon using (true) with check (true)';
  end if;
end $$;

-- Allow anon key to read/write transactions
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'transactions' and policyname = 'anon full access transactions'
  ) then
    execute 'create policy "anon full access transactions" on transactions for all to anon using (true) with check (true)';
  end if;
end $$;

-- Allow anon key to read/write users
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'users' and policyname = 'anon full access users'
  ) then
    execute 'create policy "anon full access users" on users for all to anon using (true) with check (true)';
  end if;
end $$;

-- -------------------------------------------------------------
-- 5. AUTO-UPDATE updated_at ON inventory CHANGES
-- -------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger inventory_set_updated_at
  before update on inventory
  for each row
  execute function set_updated_at();

-- -------------------------------------------------------------
-- 6. AUTO-DELETE EXPIRED USERS
--    This function deletes any user whose expires_at is in the
--    past. Call it from the app on login, or schedule it via
--    pg_cron if available on your Supabase plan.
-- -------------------------------------------------------------
create or replace function delete_expired_users()
returns void language plpgsql as $$
begin
  delete from users
  where expires_at is not null
    and expires_at < now();
end;
$$;

-- Optional: trigger that cleans up expired users on every INSERT
-- or UPDATE to the users table (keeps things tidy automatically).
create or replace function auto_delete_expired_users()
returns trigger language plpgsql as $$
begin
  perform delete_expired_users();
  return new;
end;
$$;

create or replace trigger users_auto_delete_expired
  after insert or update on users
  for each statement
  execute function auto_delete_expired_users();

-- -------------------------------------------------------------
-- 7. SEED DEFAULT ADMIN
--    Password: admin123  (bcrypt hash — user will be forced to
--    change it on first login via must_change_password = true).
--    expires_at is NULL so admin never expires.
-- -------------------------------------------------------------
insert into users (username, password, role, must_change_password, expires_at)
values (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123
  'admin',
  true,
  null
)
on conflict (username) do nothing;

-- -------------------------------------------------------------
-- NOTE: The local SQLite database in the Electron app caches
-- users for offline login. The Supabase users table is the
-- source of truth. On every successful online login the app
-- updates the local cache.
-- -------------------------------------------------------------
