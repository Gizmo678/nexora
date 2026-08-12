import { Request, Response, NextFunction } from 'express';
import { createUserSchema, updateUserSchema, updateStatusSchema, userQuerySchema } from '../validators/user.validator';
import * as userService from '../services/user.service';
import { sendSuccess } from '../utils/response';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = userQuerySchema.parse(req.query);
    const result = await userService.getUsers(query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, user);
  } catch (error) {
    return next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await userService.createUser(data);
    return sendSuccess(res, user, 201, 'User created successfully');
  } catch (error) {
    return next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.params.id, req.user!.userId, data);
    return sendSuccess(res, user, 200, 'User updated successfully');
  } catch (error) {
    return next(error);
  }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = updateStatusSchema.parse(req.body);
    const user = await userService.updateUserStatus(req.params.id, req.user!.userId, status);
    return sendSuccess(res, user, 200, `User ${status.toLowerCase()} successfully`);
  } catch (error) {
    return next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.deleteUser(req.params.id, req.user!.userId);
    return sendSuccess(res, result, 200, result.message);
  } catch (error) {
    return next(error);
  }
}
