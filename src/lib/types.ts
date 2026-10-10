export type Role = "owner" | "admin" | "kasir";

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
  employeeId?: string;
}

export type Unit = "kg" | "gram" | "liter" | "ml" | "pcs";

export interface Ingredient {
  id: string;
  name: string;
  purchaseUnit: string;
  purchasePrice: number;
  baseUnit: Unit;
  conversionFactor: number;
  stockBase: number;
  minStockBase: number;
  updatedAt: string;
}

export interface PriceHistory {
  id: string;
  ingredientId: string;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
  userId: string;
}

export interface RecipeItem {
  ingredientId: string;
  qtyBase: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
  recipe: RecipeItem[];
}

export type PaymentMethod = "cash" | "qris";

export interface SaleItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  hpp: number;
}

export interface Sale {
  id: string;
  date: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  total: number;
  totalHpp: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  note?: string;
}

export type DepositStatus = "sesuai" | "selisih_kecil" | "kurang";

export interface Deposit {
  id: string;
  date: string;
  cashierId: string;
  cashierName: string;
  totalCash: number;
  totalQris: number;
  actualCash: number;
  difference: number;
  status: DepositStatus;
  note: string;
}

export interface ReceivablePayment {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface Receivable {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  product: string;
  total: number;
  payments: ReceivablePayment[];
  dueDate: string;
  note?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  username: string;
  baseSalary: number;
  mealAllowancePerDay: number;
  salesTarget: number;
  targetBonus: number;
  deduction: number;
  active: boolean;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  daysWorked: number;
  baseSalary: number;
  mealAllowance: number;
  salesAchieved: number;
  targetBonus: number;
  bonus: number;
  deduction: number;
  total: number;
  createdAt: string;
}

export interface Waste {
  id: string;
  date: string;
  itemType: "ingredient" | "product";
  itemId: string;
  itemName: string;
  qty: number;
  unitLabel: string;
  cost: number;
  reason: string;
  reportedBy: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  module: string;
  detail: string;
}

export interface AppData {
  users: User[];
  ingredients: Ingredient[];
  priceHistory: PriceHistory[];
  products: Product[];
  sales: Sale[];
  deposits: Deposit[];
  receivables: Receivable[];
  employees: Employee[];
  payrolls: Payroll[];
  wastes: Waste[];
  expenses: Expense[];
  auditLogs: AuditLog[];
}
