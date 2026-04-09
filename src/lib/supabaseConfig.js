// Supabase Configuration
// Replace these with your actual Supabase credentials when ready

export const supabaseConfig = {
  url: process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
  anonKey: process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
}

// To set up Supabase:
// 1. Go to https://supabase.com and create a new project
// 2. Go to Project Settings → API
// 3. Copy your Project URL and anon/public API key
// 4. Create a .env file in the project root with:
//    SUPABASE_URL=your_project_url
//    SUPABASE_ANON_KEY=your_anon_key
//
// Database Schema:
// Run these SQL commands in Supabase SQL Editor:
/*

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  quantity INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create default admin user (password: admin123)
-- Hash generated with bcrypt, rounds=10
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2a$10$8K1p/a0dL3LKzOkD7rj7NeJQZqI5Y4L8YJ4Z3qnQXKY9Z5Q8YH9K2', 'admin');

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all authenticated operations)
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON inventory FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON transactions FOR ALL USING (true);

*/
