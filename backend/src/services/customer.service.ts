import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/app-error';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  AddFollowUpInput,
  CustomerQueryParams,
} from '../validators/customer.validator';

export async function getCustomers(query: CustomerQueryParams) {
  const { search, customerType, status, page, limit } = query;

  const where: Prisma.CustomerWhereInput = {};

  if (search && search.trim() !== '') {
    const s = search.trim();
    where.OR = [
      { customerName: { contains: s, mode: 'insensitive' } },
      { businessName: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { mobile: { contains: s, mode: 'insensitive' } },
    ];
  }

  if (customerType) {
    where.customerType = customerType;
  }

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { followUps: true, challans: true },
        },
      },
    }),
  ]);

  return {
    items: customers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createCustomer(data: CreateCustomerInput) {
  return await prisma.customer.create({
    data: {
      customerName: data.customerName,
      mobile: data.mobile,
      email: data.email.toLowerCase(),
      businessName: data.businessName,
      gstNumber: data.gstNumber || null,
      customerType: data.customerType,
      address: data.address,
      status: data.status,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      notes: data.notes || null,
    },
  });
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followUps: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      _count: {
        select: { challans: true },
      },
    },
  });

  if (!customer) {
    throw new AppError(`Customer with ID '${id}' not found`, 404, 'NOT_FOUND');
  }

  return customer;
}

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  await getCustomerById(id); // Ensure customer exists

  const updatePayload: Prisma.CustomerUpdateInput = {};

  if (data.customerName !== undefined) updatePayload.customerName = data.customerName;
  if (data.mobile !== undefined) updatePayload.mobile = data.mobile;
  if (data.email !== undefined) updatePayload.email = data.email.toLowerCase();
  if (data.businessName !== undefined) updatePayload.businessName = data.businessName;
  if (data.gstNumber !== undefined) updatePayload.gstNumber = data.gstNumber;
  if (data.customerType !== undefined) updatePayload.customerType = data.customerType;
  if (data.address !== undefined) updatePayload.address = data.address;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.notes !== undefined) updatePayload.notes = data.notes;
  if (data.followUpDate !== undefined) {
    updatePayload.followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;
  }

  return await prisma.customer.update({
    where: { id },
    data: updatePayload,
  });
}

export async function addFollowUp(customerId: string, createdById: string, data: AddFollowUpInput) {
  await getCustomerById(customerId); // Ensure customer exists

  const followUpDateObj = data.followUpDate ? new Date(data.followUpDate) : null;

  // Execute atomically: create follow-up log & optionally update Customer.followUpDate
  const [followUp] = await prisma.$transaction([
    prisma.customerFollowUp.create({
      data: {
        customerId,
        note: data.note,
        followUpDate: followUpDateObj,
        createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    ...(followUpDateObj
      ? [
          prisma.customer.update({
            where: { id: customerId },
            data: { followUpDate: followUpDateObj },
          }),
        ]
      : []),
  ]);

  return followUp;
}

export async function getCustomerFollowUps(customerId: string) {
  await getCustomerById(customerId);

  return await prisma.customerFollowUp.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}
