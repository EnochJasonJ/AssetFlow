import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import departmentRoutes from './routes/department.routes.js';
import categoryRoutes from './routes/category.routes.js';
import assetRoutes from './routes/asset.routes.js';
import allocationRoutes from './routes/allocation.routes.js';
import transferRoutes from './routes/transfer.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import auditRoutes from './routes/audit.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/allocations', allocationRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/audits', auditRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
