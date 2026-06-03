-- Supabase PostgreSQL Migration Script
-- Run this SQL in your Supabase SQL Editor to sync your test accounts
-- Navigate to: Supabase Dashboard > SQL Editor > paste this entire script > Run

-- Create User and Property tables if they don't exist
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Property" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price FLOAT8 NOT NULL,
  location TEXT NOT NULL,
  images TEXT NOT NULL DEFAULT '[]',
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "landlordId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Property_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Insert your 3 test accounts
INSERT INTO "User" (id, name, email, password, role, "isApproved", "createdAt", "updatedAt") 
VALUES 
  ('b94aaef02bbc0923bbe5e6b7da697a43', 'Local Admin', 'admin@local.test', '$2a$10$BC54v1LWswFxEHYLZuMKWuspuuLa/O0wFnOctWg03dzlUZ5ytWRci', 'ADMIN', true, NOW(), NOW()),
  ('5d82ac6aaa57c4e218e5bc4a579d5817', 'Local Landlord', 'landlord@local.test', '$2a$10$IBA8WVLP83GU8NqiQuKCKOGLApYu0ZyKK5mix7513nPixm8gx.JVy', 'LANDLORD', true, NOW(), NOW()),
  ('25780e4fe18c8f22a408eb19efeade3c', 'Local Tenant', 'tenant@local.test', '$2a$10$utAM6hM4Efslih4abdaT3.BMkJid2c8WALt7J90cgU23SlWDax5GS', 'TENANT', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Verify the data was inserted
SELECT COUNT(*) as "Total Users", 
       SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as "Admins",
       SUM(CASE WHEN role = 'LANDLORD' THEN 1 ELSE 0 END) as "Landlords",
       SUM(CASE WHEN role = 'TENANT' THEN 1 ELSE 0 END) as "Tenants"
FROM "User";
