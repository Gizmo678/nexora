import { Router } from 'express';
import { Role } from '@prisma/client';
import { getUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser } from '../controllers/user.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// Protect ALL user management routes with JWT and ADMIN role check
router.use(authenticateJwt);
router.use(requireRole([Role.ADMIN]));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);
router.delete('/:id', deleteUser);

export default router;
