import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import healthRouter from './routes/health';
import authRouter from './routes/auth.routes';
import customerRouter from './routes/customer.routes';
import productRouter from './routes/product.routes';
import stockMovementRouter from './routes/stock-movement.routes';
import challanRouter from './routes/challan.routes';
import dashboardRouter from './routes/dashboard.routes';
import userRouter from './routes/user.routes';
import { errorHandler } from './middlewares/error-handler';
import { sendError } from './utils/response';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

if (env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

app.use('/health', healthRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/stock-movements', stockMovementRouter);
app.use('/api/v1/challans', challanRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/users', userRouter);

app.use((req: Request, res: Response) => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND');
});

app.use(errorHandler);

export default app;
