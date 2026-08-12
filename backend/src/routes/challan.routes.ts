import { Router } from 'express';
import { Role } from '@prisma/client';
import { getChallans, createChallan, getChallanById, confirmChallan, cancelChallan } from '../controllers/challan.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();
router.use(authenticateJwt);
router.get('/', requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]), getChallans);
router.post('/', requireRole([Role.ADMIN, Role.SALES]), createChallan);
router.get('/:id', requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]), getChallanById);
router.post('/:id/confirm', requireRole([Role.ADMIN, Role.SALES]), confirmChallan);
router.post('/:id/cancel', requireRole([Role.ADMIN, Role.SALES]), cancelChallan);
export default router;
