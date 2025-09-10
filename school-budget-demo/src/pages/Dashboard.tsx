import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../contexts/BudgetContext';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { budgets, departments } = useBudget();

  // Calculate statistics
  const totalBudgets = budgets.length;
  const approvedBudgets = budgets.filter(b => b.status === 'APPROVED' || b.status === 'ACTIVE').length;
  const pendingBudgets = budgets.filter(b => b.status === 'PENDING').length;
  const totalAmount = budgets.reduce((sum, b) => sum + b.totalAmount, 0);
  const spentAmount = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const remainingAmount = totalAmount - spentAmount;

  const stats = [
    {
      name: 'Total Budgets',
      value: totalBudgets,
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Amount',
      value: `$${totalAmount.toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Spent Amount',
      value: `$${spentAmount.toLocaleString()}`,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
    },
    {
      name: 'Remaining',
      value: `$${remainingAmount.toLocaleString()}`,
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
    },
  ];

  const recentBudgets = budgets
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's an overview of your school budget management system.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Budgets */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Budgets
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Latest budget activities and updates.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {recentBudgets.map((budget) => (
                <li key={budget.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {budget.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {budget.department} • ${budget.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                        {budget.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Department Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Department Overview
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Budget allocation by department.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {departments.map((dept) => {
                const deptBudgets = budgets.filter(b => b.department === dept.name);
                const deptTotal = deptBudgets.reduce((sum, b) => sum + b.totalAmount, 0);
                const deptSpent = deptBudgets.reduce((sum, b) => sum + b.spentAmount, 0);
                const utilization = deptTotal > 0 ? (deptSpent / deptTotal) * 100 : 0;

                return (
                  <li key={dept.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {dept.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {deptBudgets.length} budgets • ${deptTotal.toLocaleString()} total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {utilization.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">utilized</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              Create Budget
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              View Reports
            </button>
            {user?.roles?.includes('ADMIN') && (
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <UsersIcon className="h-4 w-4 mr-2" />
                Manage Users
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
