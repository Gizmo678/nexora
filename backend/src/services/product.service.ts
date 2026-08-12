import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/app-error';
import { CreateProductInput, UpdateProductInput, ProductQueryParams } from '../validators/product.validator';

export async function getProducts(query: ProductQueryParams) {
  const { search, category, lowStock, page, limit } = query;
  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = { equals: category, mode: 'insensitive' };

  if (lowStock === true) {
    const lowStockIds = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM products WHERE "currentStock" <= "minStock"`;
    where.id = { in: lowStockIds.map(r => r.id) };
  }

  const skip = (page - 1) * limit;
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
  ]);

  const items = products.map((p) => ({
    ...p,
    isLowStock: p.currentStock <= p.minStock,
  }));

  return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function createProduct(data: CreateProductInput) {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw new AppError(`Product with SKU '${data.sku}' already exists`, 409, 'CONFLICT');
  return await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unitPrice: data.unitPrice,
      currentStock: data.currentStock,
      minStock: data.minStock,
      warehouseLocation: data.warehouseLocation,
    },
  });
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      movements: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { createdBy: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });
  if (!product) throw new AppError(`Product with ID '${id}' not found`, 404, 'NOT_FOUND');
  return { ...product, isLowStock: product.currentStock <= product.minStock };
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  await getProductById(id);
  if (data.sku) {
    const existing = await prisma.product.findFirst({ where: { sku: data.sku, NOT: { id } } });
    if (existing) throw new AppError(`Product with SKU '${data.sku}' already exists`, 409, 'CONFLICT');
  }
  return await prisma.product.update({ where: { id }, data });
}
