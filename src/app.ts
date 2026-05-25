import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. Local Imports (Remember the .js extension rule for NodeNext)
import ingredientRoutes from './routes/ingredient.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import customerRoutes from './routes/customer.routes.js'; // <--- Added your new routes
import companyRoutes from './routes/company.routes.js';
import authRoutes from './routes/auth.routes.js';

// Initialize environment variables
dotenv.config();

const app = express();

// 2. Global Middleware
app.use(cors());
app.use(express.json()); // Essential for your Transaction POST requests

// 3. Mount Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/customers', customerRoutes); // <--- Mounted your new Customer API
app.use('/api/companies', companyRoutes);
app.use('/api/auth', authRoutes);


// 4. Health Check
app.get('/', (req: Request, res: Response) => {
  res.send('Hospitality & CRM API is running...');
});

export default app;