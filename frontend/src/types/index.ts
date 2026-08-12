export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    challans: number;
    movements: number;
    followUps: number;
  };
}

export interface Customer {
  id: string;
  customerName: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { followUps: number; challans: number };
  followUps?: CustomerFollowUp[];
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate?: string | null;
  createdById: string;
  createdBy: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: string; // Decimal comes as string from API
  currentStock: number;
  minStock: number;
  warehouseLocation: string;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product: Pick<Product, 'id' | 'name' | 'sku'>;
  quantity: number;
  type: MovementType;
  reason: string;
  createdById: string;
  createdBy: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  createdAt: string;
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  product: Pick<Product, 'id' | 'name' | 'sku'>;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
  lineTotal: string;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer: Pick<Customer, 'id' | 'customerName' | 'businessName' | 'mobile' | 'email' | 'address' | 'gstNumber'>;
  status: ChallanStatus;
  totalQuantity: number;
  totalAmount: string;
  createdById: string;
  createdBy: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  items: ChallanItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalProducts: number;
  lowStockProductCount: number;
  draftChallans: number;
  confirmedChallans: number;
  totalSalesValue: string | number;
  upcomingFollowUps: Pick<Customer, 'id' | 'customerName' | 'businessName' | 'followUpDate' | 'status'>[];
  recentChallans: SalesChallan[];
  lowStockItems: Pick<Product, 'id' | 'name' | 'sku' | 'currentStock' | 'minStock' | 'warehouseLocation'>[];
}
