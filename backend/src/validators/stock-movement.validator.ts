import { z } from 'zod';
import { MovementType } from '@prisma/client';

export const createMovementSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  type: z.nativeEnum(MovementType),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

export const movementQuerySchema = z.object({
  productId: z.string().optional(),
  type: z.nativeEnum(MovementType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type MovementQueryParams = z.infer<typeof movementQuerySchema>;
