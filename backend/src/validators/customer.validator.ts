import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const createCustomerSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  mobile: z.string().min(7, 'Mobile number must be at least 7 digits'),
  email: z.string().email('Invalid email address format'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.nativeEnum(CustomerType).default(CustomerType.WHOLESALE),
  address: z.string().min(3, 'Address must be at least 3 characters'),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.LEAD),
  followUpDate: z
    .string()
    .datetime({ message: 'followUpDate must be a valid ISO datetime string' })
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const addFollowUpSchema = z.object({
  note: z.string().min(2, 'Follow-up note must be at least 2 characters'),
  followUpDate: z
    .string()
    .datetime({ message: 'followUpDate must be a valid ISO datetime string' })
    .optional()
    .nullable(),
});

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type AddFollowUpInput = z.infer<typeof addFollowUpSchema>;
export type CustomerQueryParams = z.infer<typeof customerQuerySchema>;
