import { ChallanStatus, MovementType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/app-error';
import { CreateChallanInput, ChallanQueryParams } from '../validators/challan.validator';
import { Decimal } from '@prisma/client/runtime/library';

async function generateChallanNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await tx.$queryRaw<{ lastValue: number }[]>`
    INSERT INTO challan_sequences (year, "lastValue") VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE SET "lastValue" = challan_sequences."lastValue" + 1
    RETURNING "lastValue"
  `;
  const num = seq[0].lastValue;
  return `CH-${year}-${String(num).padStart(4, '0')}`;
}

const CHALLAN_INCLUDE = {
  customer: { select: { id: true, customerName: true, businessName: true, mobile: true, email: true, address: true, gstNumber: true } },
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  items: {
    include: { product: { select: { id: true, name: true, sku: true } } },
  },
} as const;

export async function getChallans(query: ChallanQueryParams) {
  const { search, status, customerId, page, limit } = query;
  const where: Prisma.SalesChallanWhereInput = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (search) {
    where.OR = [
      { challanNumber: { contains: search, mode: 'insensitive' } },
      { customer: { customerName: { contains: search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  const skip = (page - 1) * limit;
  const [total, challans] = await Promise.all([
    prisma.salesChallan.count({ where }),
    prisma.salesChallan.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: CHALLAN_INCLUDE }),
  ]);
  return { items: challans, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function createChallan(createdById: string, data: CreateChallanInput) {
  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) throw new AppError('Customer not found', 404, 'NOT_FOUND');

  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) } },
  });

  if (products.length !== data.items.length) {
    throw new AppError('One or more products not found', 404, 'NOT_FOUND');
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalQuantity = 0;
  let totalAmount = new Decimal(0);
  const itemsData = data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const lineTotal = new Decimal(product.unitPrice).mul(item.quantity);
    totalQuantity += item.quantity;
    totalAmount = totalAmount.add(lineTotal);
    return {
      productId: item.productId,
      productNameSnapshot: product.name,
      skuSnapshot: product.sku,
      unitPriceSnapshot: product.unitPrice,
      quantity: item.quantity,
      lineTotal,
    };
  });

  return await prisma.$transaction(async (tx) => {
    const challanNumber = await generateChallanNumber(tx);
    return await tx.salesChallan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        status: ChallanStatus.DRAFT,
        totalQuantity,
        totalAmount,
        createdById,
        items: { create: itemsData },
      },
      include: CHALLAN_INCLUDE,
    });
  });
}

export async function getChallanById(id: string) {
  const challan = await prisma.salesChallan.findUnique({ where: { id }, include: CHALLAN_INCLUDE });
  if (!challan) throw new AppError('Sales challan not found', 404, 'NOT_FOUND');
  return challan;
}

export async function confirmChallan(challanId: string, confirmedById: string) {
  return await prisma.$transaction(async (tx) => {
    const challans = await tx.$queryRaw<any[]>`SELECT * FROM sales_challans WHERE id = ${challanId} FOR UPDATE`;
    const challan = challans[0];
    if (!challan) throw new AppError('Sales challan not found', 404, 'NOT_FOUND');
    if (challan.status !== ChallanStatus.DRAFT) {
      throw new AppError(`Challan cannot be confirmed. Current status: ${challan.status}`, 400, 'INVALID_STATUS_TRANSITION');
    }

    const items = await tx.challanItem.findMany({ where: { challanId } });

    for (const item of items) {
      const products = await tx.$queryRaw<any[]>`SELECT * FROM products WHERE id = ${item.productId} FOR UPDATE`;
      const product = products[0];
      if (!product) throw new AppError('Product in challan not found', 404, 'NOT_FOUND');
      if (product.currentStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for '${product.name}'`,
          400,
          'INSUFFICIENT_STOCK',
          { productName: product.name, availableStock: product.currentStock, requestedQuantity: item.quantity }
        );
      }
    }

    const challanWithItems = await tx.salesChallan.findUnique({
      where: { id: challanId },
      include: { items: { include: { product: true } } },
    });
    const challanNumber = challanWithItems!.challanNumber;

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: MovementType.OUT,
          reason: `Sales Challan ${challanNumber}`,
          createdById: confirmedById,
        },
      });
    }

    return await tx.salesChallan.update({
      where: { id: challanId },
      data: { status: ChallanStatus.CONFIRMED },
      include: CHALLAN_INCLUDE,
    });
  });
}

export async function cancelChallan(challanId: string) {
  const challan = await getChallanById(challanId);
  if (challan.status !== ChallanStatus.DRAFT) {
    throw new AppError(`Only DRAFT challans can be cancelled. Current status: ${challan.status}`, 400, 'INVALID_STATUS_TRANSITION');
  }
  return await prisma.salesChallan.update({
    where: { id: challanId },
    data: { status: ChallanStatus.CANCELLED },
    include: CHALLAN_INCLUDE,
  });
}
