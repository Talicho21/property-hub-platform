# Property Platform - Database Setup Guide

## 🎯 Current Status

✅ **Local Development (Working Now)**

- Backend: Running on `http://localhost:5000` with SQLite
- Frontend: Ready on `http://localhost:5175`
- Database: Local `dev.db` with 3 test accounts seeded

✅ **Test Accounts Available Locally**

```
Email: admin@local.test          | Password: Admin123!  | Role: ADMIN
Email: landlord@local.test       | Password: Landlord123! | Role: LANDLORD
Email: tenant@local.test         | Password: Tenant123! | Role: TENANT
```

---

## 🚀 How to Sync Test Accounts to Supabase (Manual Process)

Your local test accounts are ready to be synced to Supabase. Since your local machine cannot directly reach Supabase's PostgreSQL server, use this manual migration process:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: [https://app.supabase.com](https://app.supabase.com)
2. Select your **property-platform** project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration Script

1. Open this file: `backend/scripts/supabase_migration.sql`
2. Copy **ALL** the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)

### Step 3: Verify the Data

After running the script, you should see a result showing:

- Total Users: 3
- Admins: 1
- Landlords: 1
- Tenants: 1

Your Supabase User table will now contain the same 3 test accounts!

---

## 🔄 Switching to Supabase in the Future

When you have network access to Supabase or want to deploy to production:

### Option A: Use Supabase PostgreSQL (Production)

1. **Edit** `backend/.env`:

```env
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://postgres:%40Talicho1995@db.kveeduusqwbqxzmuxwqy.supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:%40Talicho1995@db.kveeduusqwbqxzmuxwqy.supabase.co:5432/postgres?sslmode=require"
```

2. **Edit** `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

3. **Regenerate Prisma & start backend**:

```bash
cd backend
npx prisma generate
node server.js
```

4. The backend will automatically connect to Supabase and use the migrated accounts!

### Option B: Keep Using Local SQLite (Recommended for Development)

- No changes needed. Continue using the current setup for local testing.
- When deploying to production, switch to PostgreSQL (see Option A).

---

## 📋 Backend API Endpoints

| Method | Endpoint                          | Purpose                             |
| ------ | --------------------------------- | ----------------------------------- |
| POST   | `/api/auth/login`                 | User login                          |
| POST   | `/api/auth/register`              | New user registration               |
| GET    | `/api/test-db`                    | Test database connection            |
| GET    | `/api/properties`                 | List all properties                 |
| POST   | `/api/properties`                 | Create new property                 |
| GET    | `/api/admin/users`                | List all users (admin only)         |
| GET    | `/api/admin/pending-landlords`    | List pending landlords (admin only) |
| PUT    | `/api/admin/approve-landlord/:id` | Approve landlord (admin only)       |

---

## 🐛 Troubleshooting

### "Invalid email or password" on login

- ✅ Accounts exist locally in SQLite
- ⚠️ If using Supabase: Run the migration script first (Step 2 above)

### "Can't reach database server" error

- Your machine cannot reach Supabase due to network/firewall
- **Solution**: Stay on SQLite for local development (current setup)
- Migrate manually via SQL Editor when needed

### Backend won't start

```bash
cd backend
npx prisma generate
node server.js
```

---

## 📝 File Reference

- **Supabase Migration SQL**: `backend/scripts/supabase_migration.sql`
- **Backend Config**: `backend/.env`
- **Prisma Schema**: `backend/prisma/schema.prisma`
- **Local Database**: `backend/dev.db`

---

## ✨ What's Next?

1. **Test locally**: Use the 3 test accounts in the frontend UI
2. **When ready for Supabase**: Run the migration script (Step 1-3 above)
3. **Switch backend to PostgreSQL**: Follow Option A when needed
4. **Deploy to production**: Use Supabase PostgreSQL with production credentials
