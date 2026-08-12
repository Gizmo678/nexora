import { Router } from 'express';
import { Role } from '@prisma/client';
import { getMovements, createMovement } from '../controllers/stock-movement.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();
router.use(authenticateJwt);
router.get('/', requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]), getMovements);
router.post('/', requireRole([Role.ADMIN, Role.WAREHOUSE]), createMovement);
export default router;
