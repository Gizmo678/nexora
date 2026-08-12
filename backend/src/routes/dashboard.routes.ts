import { Router, Request, Response, NextFunction } from 'express';
import { Role, ChallanStatus } from '@prisma/client';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';

const router = Router();
router.use(authenticateJwt);
router.use(requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]));

router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const lowStockCountResult = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM products WHERE "currentStock" <= "minStock"`;
    const lowStockProductCount = Number(lowStockCountResult[0].count);

    const [totalCustomers, totalProducts, draftChallans, confirmedChallans, upcomingFollowUps, recentChallans] =
      await Promise.all([
        prisma.customer.count(),
        prisma.product.count(),
        prisma.salesChallan.count({ where: { status: ChallanStatus.DRAFT } }),
        prisma.salesChallan.aggregate({ where: { status: ChallanStatus.CONFIRMED }, _sum: { totalAmount: true }, _count: true }),
        prisma.customer.findMany({
          where: { followUpDate: { gte: now, lte: sevenDaysFromNow } },
          select: { id: true, customerName: true, businessName: true, followUpDate: true, status: true },
          orderBy: { followUpDate: 'asc' },
          take: 5,
        }),
        prisma.salesChallan.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            customer: { select: { id: true, customerName: true, businessName: true } },
            createdBy: { select: { id: true, name: true } },
          },
        }),
      ]);

    const lowStockItems = await prisma.$queryRaw<any[]>`SELECT id, name, sku, "currentStock", "minStock", "warehouseLocation" FROM products WHERE "currentStock" <= "minStock" ORDER BY "currentStock" ASC LIMIT 5`;

    return sendSuccess(res, {
      totalCustomers,
      totalProducts,
      lowStockProductCount,
      draftChallans,
      confirmedChallans: confirmedChallans._count,
      totalSalesValue: confirmedChallans._sum.totalAmount ?? 0,
      upcomingFollowUps,
      recentChallans,
      lowStockItems,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
