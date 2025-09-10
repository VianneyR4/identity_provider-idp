import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Budget, Department, BudgetContextType } from '../types';
import apiService from '../services/api';

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};

interface BudgetProviderProps {
  children: ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [departments] = useState<Department[]>([
    { id: 1, name: 'Mathematics', description: 'Math Department', budgetLimit: 50000, isActive: true },
    { id: 2, name: 'Science', description: 'Science Department', budgetLimit: 75000, isActive: true },
    { id: 3, name: 'English', description: 'English Department', budgetLimit: 30000, isActive: true },
    { id: 4, name: 'History', description: 'History Department', budgetLimit: 25000, isActive: true },
    { id: 5, name: 'Physical Education', description: 'PE Department', budgetLimit: 40000, isActive: true },
    { id: 6, name: 'Technology', description: 'IT Department', budgetLimit: 100000, isActive: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getBudgets();
      if (response.success && response.data) {
        setBudgets(response.data);
      } else {
        // For demo purposes, use mock data if API fails
        setBudgets(mockBudgets);
      }
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
      // Use mock data for demo
      setBudgets(mockBudgets);
    } finally {
      setLoading(false);
    }
  };

  const createBudget = async (budget: Partial<Budget>): Promise<boolean> => {
    try {
      const response = await apiService.createBudget(budget);
      if (response.success && response.data) {
        setBudgets(prev => [...prev, response.data!]);
        return true;
      } else {
        // For demo purposes, create mock budget
        const newBudget: Budget = {
          id: Date.now(),
          name: budget.name || 'New Budget',
          description: budget.description || '',
          totalAmount: budget.totalAmount || 0,
          spentAmount: 0,
          remainingAmount: budget.totalAmount || 0,
          department: budget.department || 'General',
          category: budget.category || 'General',
          status: 'DRAFT',
          createdBy: { id: 1, email: 'demo@example.com', firstName: 'Demo', lastName: 'User', roles: ['USER'], isActive: true, emailVerified: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          startDate: budget.startDate || new Date().toISOString(),
          endDate: budget.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setBudgets(prev => [...prev, newBudget]);
        return true;
      }
    } catch (err) {
      setError('Failed to create budget');
      return false;
    }
  };

  const updateBudget = async (id: number, budget: Partial<Budget>): Promise<boolean> => {
    try {
      const response = await apiService.updateBudget(id, budget);
      if (response.success && response.data) {
        setBudgets(prev => prev.map(b => b.id === id ? response.data! : b));
        return true;
      } else {
        // For demo purposes, update mock budget
        setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...budget, updatedAt: new Date().toISOString() } : b));
        return true;
      }
    } catch (err) {
      setError('Failed to update budget');
      return false;
    }
  };

  const deleteBudget = async (id: number): Promise<boolean> => {
    try {
      const response = await apiService.deleteBudget(id);
      if (response.success) {
        setBudgets(prev => prev.filter(b => b.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      setError('Failed to delete budget');
      return false;
    }
  };

  const approveBudget = async (id: number): Promise<boolean> => {
    try {
      const response = await apiService.approveBudget(id);
      if (response.success && response.data) {
        setBudgets(prev => prev.map(b => b.id === id ? response.data! : b));
        return true;
      } else {
        // For demo purposes, approve mock budget
        setBudgets(prev => prev.map(b => b.id === id ? { ...b, status: 'APPROVED' as const, updatedAt: new Date().toISOString() } : b));
        return true;
      }
    } catch (err) {
      setError('Failed to approve budget');
      return false;
    }
  };

  const rejectBudget = async (id: number): Promise<boolean> => {
    try {
      const response = await apiService.rejectBudget(id);
      if (response.success && response.data) {
        setBudgets(prev => prev.map(b => b.id === id ? response.data! : b));
        return true;
      } else {
        // For demo purposes, reject mock budget
        setBudgets(prev => prev.map(b => b.id === id ? { ...b, status: 'REJECTED' as const, updatedAt: new Date().toISOString() } : b));
        return true;
      }
    } catch (err) {
      setError('Failed to reject budget');
      return false;
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const value: BudgetContextType = {
    budgets,
    departments,
    loading,
    error,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    approveBudget,
    rejectBudget,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

// Mock data for demo purposes
const mockBudgets: Budget[] = [
  {
    id: 1,
    name: 'Mathematics Textbooks 2024',
    description: 'Purchase new mathematics textbooks for grades 9-12',
    totalAmount: 15000,
    spentAmount: 8500,
    remainingAmount: 6500,
    department: 'Mathematics',
    category: 'Educational Materials',
    status: 'APPROVED',
    createdBy: { id: 2, email: 'math.head@school.edu', firstName: 'Sarah', lastName: 'Johnson', roles: ['DEPARTMENT_HEAD'], isActive: true, emailVerified: true, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
    approvedBy: { id: 1, email: 'admin@school.edu', firstName: 'John', lastName: 'Admin', roles: ['ADMIN'], isActive: true, emailVerified: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-02-01T14:20:00Z',
  },
  {
    id: 2,
    name: 'Science Lab Equipment',
    description: 'Upgrade chemistry and physics lab equipment',
    totalAmount: 25000,
    spentAmount: 12000,
    remainingAmount: 13000,
    department: 'Science',
    category: 'Equipment',
    status: 'ACTIVE',
    createdBy: { id: 3, email: 'science.head@school.edu', firstName: 'Michael', lastName: 'Chen', roles: ['DEPARTMENT_HEAD'], isActive: true, emailVerified: true, createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
    approvedBy: { id: 1, email: 'admin@school.edu', firstName: 'John', lastName: 'Admin', roles: ['ADMIN'], isActive: true, emailVerified: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2024-11-30T23:59:59Z',
    createdAt: '2024-01-20T09:15:00Z',
    updatedAt: '2024-03-15T11:45:00Z',
  },
  {
    id: 3,
    name: 'Technology Infrastructure Upgrade',
    description: 'Upgrade school network and computer lab systems',
    totalAmount: 50000,
    spentAmount: 0,
    remainingAmount: 50000,
    department: 'Technology',
    category: 'Infrastructure',
    status: 'PENDING',
    createdBy: { id: 4, email: 'it.head@school.edu', firstName: 'Lisa', lastName: 'Rodriguez', roles: ['DEPARTMENT_HEAD'], isActive: true, emailVerified: true, createdAt: '2024-01-05T00:00:00Z', updatedAt: '2024-01-05T00:00:00Z' },
    startDate: '2024-04-01T00:00:00Z',
    endDate: '2024-08-31T23:59:59Z',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-01T08:00:00Z',
  },
];
