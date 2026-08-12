import { Request, Response, NextFunction } from 'express';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addFollowUpSchema,
  customerQuerySchema,
} from '../validators/customer.validator';
import * as customerService from '../services/customer.service';
import { sendSuccess } from '../utils/response';

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = customerQuerySchema.parse(req.query);
    const result = await customerService.getCustomers(query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = createCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer(validatedData);
    return sendSuccess(res, customer, 201, 'Customer created successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    return sendSuccess(res, customer);
  } catch (error) {
    return next(error);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const validatedData = updateCustomerSchema.parse(req.body);
    const updatedCustomer = await customerService.updateCustomer(id, validatedData);
    return sendSuccess(res, updatedCustomer, 200, 'Customer updated successfully');
  } catch (error) {
    return next(error);
  }
}

export async function addFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const createdById = req.user!.userId;
    const validatedData = addFollowUpSchema.parse(req.body);
    const followUp = await customerService.addFollowUp(id, createdById, validatedData);
    return sendSuccess(res, followUp, 201, 'Follow-up note added successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getCustomerFollowUps(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const followUps = await customerService.getCustomerFollowUps(id);
    return sendSuccess(res, followUps);
  } catch (error) {
    return next(error);
  }
}
