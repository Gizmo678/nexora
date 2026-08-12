import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
