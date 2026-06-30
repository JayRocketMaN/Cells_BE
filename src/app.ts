import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import ingredientRoutes from './routes/ingredient.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import customerRoutes from './routes/customer.routes.js'; // 
import authRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';

// Initialize environment variables
dotenv.config();

const app = express();

// 2. Global Middleware
app.use(express.json()); // Essential for your Transaction POST requests
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3026',
    ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'admin-id'],
  credentials: true
}));

//Cookie parser middleware with secret for signed cookies
app.use(cookieParser(process.env.COOKIE_SECRET));

// 3. Mount Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/customers', customerRoutes); // <--- Mounted your new Customer API
app.use('/api/companies', companyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);


// 4. Health Check
app.get('/', (req: Request, res: Response) => {
  res.send('Hospitality & CRM API is running...');
});

export default app;