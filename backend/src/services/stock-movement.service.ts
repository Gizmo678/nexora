import { MovementType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/app-error';
import { CreateMovementInput, MovementQueryParams } from '../validators/stock-movement.validator';

export async function getMovements(query: MovementQueryParams) {
  const { productId, type, page, limit } = query;
  const where: Prisma.StockMovementWhereInput = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;
  const skip = (page - 1) * limit;
  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
  ]);
  return { items: movements, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function createMovement(createdById: string, data: CreateMovementInput) {
  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new AppError(`Product with ID '${data.productId}' not found`, 404, 'NOT_FOUND');

  return await prisma.$transaction(async (tx) => {
    if (data.type === MovementType.OUT) {
      if (product.currentStock < data.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}`,
          400,
          'INSUFFICIENT_STOCK',
          { availableStock: product.currentStock, requestedQuantity: data.quantity, productName: product.name }
        );
      }
      await tx.product.update({ where: { id: data.productId }, data: { currentStock: { decrement: data.quantity } } });
    } else {
      await tx.product.update({ where: { id: data.productId }, data: { currentStock: { increment: data.quantity } } });
    }
    return await tx.stockMovement.create({
      data: { productId: data.productId, quantity: data.quantity, type: data.type, reason: data.reason, createdById },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  });
}
