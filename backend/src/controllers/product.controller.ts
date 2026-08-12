import { Request, Response, NextFunction } from 'express';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../validators/product.validator';
import * as productService from '../services/product.service';
import { sendSuccess } from '../utils/response';

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const query = productQuerySchema.parse(req.query);
    const result = await productService.getProducts(query);
    return sendSuccess(res, result);
  } catch (error) { return next(error); }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await productService.createProduct(data);
    return sendSuccess(res, product, 201, 'Product created successfully');
  } catch (error) { return next(error); }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getProductById(req.params.id);
    return sendSuccess(res, product);
  } catch (error) { return next(error); }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(req.params.id, data);
    return sendSuccess(res, product, 200, 'Product updated successfully');
  } catch (error) { return next(error); }
}
