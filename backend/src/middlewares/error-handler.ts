import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { sendError } from '../utils/response';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', formattedErrors);
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error('❌ Database Connection Error:', err.message);
    return sendError(
      res,
      'Database connection failed. Please ensure PostgreSQL is running.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error('❌ Prisma Request Error:', err.code, err.message);
    return sendError(res, `Database error: ${err.message}`, 400, 'DATABASE_ERROR', { prismaCode: err.code });
  }

  console.error('Unhandled Server Error:', err);
  return sendError(res, 'Internal server error', 500, 'INTERNAL_SERVER_ERROR');
}
