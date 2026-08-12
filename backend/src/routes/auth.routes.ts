import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateJwt, getMe);

export default router;
