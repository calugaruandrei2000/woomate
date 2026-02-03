import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes.js';
import storeRoutes from './routes/store.routes.js';
import aiRoutes from './routes/ai.routes.js';
import billingRoutes from './routes/billing.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/store', storeRoutes);
app.use('/ai', aiRoutes);
app.use('/billing', billingRoutes);
app.use('/analytics', analyticsRoutes);

export default app;
