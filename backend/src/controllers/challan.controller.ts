import { Request, Response, NextFunction } from 'express';
import { createChallanSchema, challanQuerySchema } from '../validators/challan.validator';
import * as challanService from '../services/challan.service';
import { sendSuccess } from '../utils/response';

export async function getChallans(req: Request, res: Response, next: NextFunction) {
  try {
    const query = challanQuerySchema.parse(req.query);
    return sendSuccess(res, await challanService.getChallans(query));
  } catch (e) { return next(e); }
}

export async function createChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createChallanSchema.parse(req.body);
    const challan = await challanService.createChallan(req.user!.userId, data);
    return sendSuccess(res, challan, 201, 'Sales challan created as DRAFT');
  } catch (e) { return next(e); }
}

export async function getChallanById(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, await challanService.getChallanById(req.params.id));
  } catch (e) { return next(e); }
}

export async function confirmChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const challan = await challanService.confirmChallan(req.params.id, req.user!.userId);
    return sendSuccess(res, challan, 200, 'Challan confirmed. Stock deducted.');
  } catch (e) { return next(e); }
}

export async function cancelChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const challan = await challanService.cancelChallan(req.params.id);
    return sendSuccess(res, challan, 200, 'Challan cancelled');
  } catch (e) { return next(e); }
}
