import { Request, Response, NextFunction } from 'express';
import { createMovementSchema, movementQuerySchema } from '../validators/stock-movement.validator';
import * as stockService from '../services/stock-movement.service';
import { sendSuccess } from '../utils/response';

export async function getMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const query = movementQuerySchema.parse(req.query);
    const result = await stockService.getMovements(query);
    return sendSuccess(res, result);
  } catch (error) { return next(error); }
}

export async function createMovement(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createMovementSchema.parse(req.body);
    const movement = await stockService.createMovement(req.user!.userId, data);
    return sendSuccess(res, movement, 201, 'Stock movement recorded successfully');
  } catch (error) { return next(error); }
}
