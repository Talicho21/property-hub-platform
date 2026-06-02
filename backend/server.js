// 1. Initialize environment variables at the absolute top of the scope
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

// 2. Import external npm modules
import express from 'express';
import cors from 'cors';

// 3. Import application routing modules (with mandatory .js extensions for ES Modules)
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// 4. Global Middlewares
app.use(cors());
app.use(express.json());

// 5. API Route Deflections
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);

// 6. Base Smoke-Test Route
app.get('/', (req, res) => {
  res.send('Multi-Tenant Property Management API running smoothly!');
});

// 7. Initialize Listener Engine
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server blasting off on port ${PORT} 🚀`);
  // Diagnostic verification log
  console.log(`Database Connection String Detected: ${process.env.DATABASE_URL ? 'YES ✅' : 'NO ❌ (Check .env file position)'}`);
});