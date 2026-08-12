import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

export const challanItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  items: z.array(challanItemSchema).min(1, 'At least one item is required'),
});

export const challanQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(ChallanStatus).optional(),
  customerId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type ChallanQueryParams = z.infer<typeof challanQuerySchema>;
