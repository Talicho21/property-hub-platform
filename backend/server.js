// 1. Initialize environment variables at the absolute top of the scope
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

// 2. Import external npm modules
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';

// 3. Import Prisma Client
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// 4. Import application routing modules
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const prisma = new PrismaClient();

// 5. Global Middlewares
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// 6. API Route Deflections
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);

// 7. Base Smoke-Test Route
app.get('/', (req, res) => {
  res.send('Multi-Tenant Property Management API running smoothly!');
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ message: 'Database connected successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Global Error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: err.message 
  });
});

// 8. Initialize Server
const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Test database connection before starting server
async function ensureDevAdmin() {
  if (process.env.NODE_ENV === 'production') return;
  if (!process.env.DEV_ADMIN_EMAIL || !process.env.DEV_ADMIN_PASSWORD) return;

  const existingAdmin = await prisma.user.findUnique({
    where: { email: process.env.DEV_ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(process.env.DEV_ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        name: 'Local Admin',
        email: process.env.DEV_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'ADMIN',
        isApproved: true,
      },
    });
    console.log('✅ Dev admin user created:', process.env.DEV_ADMIN_EMAIL);
  }
}

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    await ensureDevAdmin();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server blasting off on port ${PORT}`);
      console.log(`📊 Database Connection String Detected: ${process.env.DATABASE_URL ? 'YES ✅' : 'NO ❌'}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Another server process may already be running.`);
        console.error('Please stop the existing process or set PORT to a free port before restarting.');
        process.exit(1);
      }
      console.error('🔥 Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your DATABASE_URL in environment variables');
    process.exit(1);
  }
}

startServer();