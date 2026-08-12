import { Router } from 'express';
import { Role } from '@prisma/client';
import { getProducts, createProduct, getProductById, updateProduct } from '../controllers/product.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();
router.use(authenticateJwt);
router.get('/', requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]), getProducts);
router.get('/:id', requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]), getProductById);
router.post('/', requireRole([Role.ADMIN, Role.WAREHOUSE]), createProduct);
router.patch('/:id', requireRole([Role.ADMIN, Role.WAREHOUSE]), updateProduct);
export default router;
