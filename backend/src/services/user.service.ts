import bcrypt from 'bcryptjs';
import { Prisma, Role, UserStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/app-error';
import { CreateUserInput, UpdateUserInput, UserQueryParams } from '../validators/user.validator';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getUsers(query: UserQueryParams) {
  const { search, role, status, page, limit } = query;
  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) where.role = role;
  if (status) where.status = status;

  const skip = (page - 1) * limit;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: USER_SELECT,
    }),
  ]);

  return {
    items: users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...USER_SELECT,
      _count: {
        select: {
          challans: true,
          movements: true,
          followUps: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(`User with ID '${id}' not found`, 404, 'NOT_FOUND');
  }

  return user;
}

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    throw new AppError(`User with email '${data.email}' already exists`, 409, 'CONFLICT');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  return await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      status: data.status ?? UserStatus.ACTIVE,
    },
    select: USER_SELECT,
  });
}

export async function updateUser(targetId: string, adminUserId: string, data: UpdateUserInput) {
  const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
  if (!targetUser) {
    throw new AppError(`User with ID '${targetId}' not found`, 404, 'NOT_FOUND');
  }

  // Self-protection check
  if (targetId === adminUserId) {
    if (data.role && data.role !== Role.ADMIN) {
      throw new AppError('Cannot demote your own admin account', 400, 'SELF_DEMOTION_DENIED');
    }
    if (data.status && data.status === UserStatus.SUSPENDED) {
      throw new AppError('Cannot suspend your own admin account', 400, 'SELF_SUSPENSION_DENIED');
    }
  }

  // Final Admin Protection check
  if (targetUser.role === Role.ADMIN) {
    const activeAdminCount = await prisma.user.count({
      where: { role: Role.ADMIN, status: UserStatus.ACTIVE },
    });

    if (activeAdminCount <= 1) {
      if (data.role && data.role !== Role.ADMIN) {
        throw new AppError('Cannot change role of the final remaining Admin account', 400, 'LAST_ADMIN_PROTECTION');
      }
      if (data.status && data.status === UserStatus.SUSPENDED) {
        throw new AppError('Cannot suspend the final remaining Admin account', 400, 'LAST_ADMIN_PROTECTION');
      }
    }
  }

  // Duplicate email check if updating email
  if (data.email && data.email.toLowerCase() !== targetUser.email.toLowerCase()) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email.toLowerCase(), NOT: { id: targetId } },
    });
    if (existing) {
      throw new AppError(`User with email '${data.email}' already exists`, 409, 'CONFLICT');
    }
  }

  const updateData: Prisma.UserUpdateInput = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email.toLowerCase();
  if (data.role) updateData.role = data.role;
  if (data.status) updateData.status = data.status;
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  return await prisma.user.update({
    where: { id: targetId },
    data: updateData,
    select: USER_SELECT,
  });
}

export async function updateUserStatus(targetId: string, adminUserId: string, status: UserStatus) {
  return await updateUser(targetId, adminUserId, { status });
}

export async function deleteUser(targetId: string, adminUserId: string) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    include: {
      _count: {
        select: {
          challans: true,
          movements: true,
          followUps: true,
        },
      },
    },
  });

  if (!targetUser) {
    throw new AppError(`User with ID '${targetId}' not found`, 404, 'NOT_FOUND');
  }

  // Self-protection check
  if (targetId === adminUserId) {
    throw new AppError('Cannot delete your own admin account', 400, 'SELF_DELETION_DENIED');
  }

  // Final Admin check
  if (targetUser.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) {
      throw new AppError('Cannot delete the final remaining Admin account', 400, 'LAST_ADMIN_PROTECTION');
    }
  }

  // Business relations check to preserve data integrity
  const totalRelations = targetUser._count.challans + targetUser._count.movements + targetUser._count.followUps;
  if (totalRelations > 0) {
    throw new AppError(
      `Cannot delete user '${targetUser.name}' because they are referenced in ${totalRelations} business record(s) (sales challans / stock movements / follow-ups). Suspend the user instead to preserve historical audit records.`,
      400,
      'HAS_HISTORICAL_RECORDS',
      {
        challansCount: targetUser._count.challans,
        movementsCount: targetUser._count.movements,
        followUpsCount: targetUser._count.followUps,
      }
    );
  }

  await prisma.user.delete({ where: { id: targetId } });
  return { message: `User '${targetUser.name}' removed successfully` };
}
