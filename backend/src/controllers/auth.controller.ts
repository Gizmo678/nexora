import { Request, Response, NextFunction } from 'express';
import { loginSchema } from '../validators/auth.validator';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedData);
    return sendSuccess(res, result, 200, 'Login successful');
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new Error('User not found in request context'));
    }
    const profile = await authService.getUserProfile(req.user.userId);
    return sendSuccess(res, profile);
  } catch (error) {
    return next(error);
  }
}
