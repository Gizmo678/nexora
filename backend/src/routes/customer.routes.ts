import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  addFollowUp,
  getCustomerFollowUps,
} from '../controllers/customer.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// All customer routes require valid JWT authentication
router.use(authenticateJwt);

// GET /api/v1/customers (ADMIN, SALES, ACCOUNTS)
router.get('/', requireRole([Role.ADMIN, Role.SALES, Role.ACCOUNTS]), getCustomers);

// POST /api/v1/customers (ADMIN, SALES)
router.post('/', requireRole([Role.ADMIN, Role.SALES]), createCustomer);

// GET /api/v1/customers/:id (ADMIN, SALES, ACCOUNTS)
router.get('/:id', requireRole([Role.ADMIN, Role.SALES, Role.ACCOUNTS]), getCustomerById);

// PATCH /api/v1/customers/:id (ADMIN, SALES)
router.patch('/:id', requireRole([Role.ADMIN, Role.SALES]), updateCustomer);

// GET /api/v1/customers/:id/follow-ups (ADMIN, SALES, ACCOUNTS)
router.get('/:id/follow-ups', requireRole([Role.ADMIN, Role.SALES, Role.ACCOUNTS]), getCustomerFollowUps);

// POST /api/v1/customers/:id/follow-ups (ADMIN, SALES)
router.post('/:id/follow-ups', requireRole([Role.ADMIN, Role.SALES]), addFollowUp);

export default router;
