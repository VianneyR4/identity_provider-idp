export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Budget {
  id: number;
  name: string;
  description: string;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  department: string;
  category: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED';
  createdBy: User;
  approvedBy?: User;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: number;
  budgetId: number;
  description: string;
  amount: number;
  category: string;
  isSpent: boolean;
  spentDate?: string;
  createdAt: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  headUserId?: number;
  budgetLimit: number;
  isActive: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

export interface BudgetContextType {
  budgets: Budget[];
  departments: Department[];
  loading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  createBudget: (budget: Partial<Budget>) => Promise<boolean>;
  updateBudget: (id: number, budget: Partial<Budget>) => Promise<boolean>;
  deleteBudget: (id: number) => Promise<boolean>;
  approveBudget: (id: number) => Promise<boolean>;
  rejectBudget: (id: number) => Promise<boolean>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
