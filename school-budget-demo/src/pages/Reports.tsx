import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../contexts/BudgetContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports: React.FC = () => {
  const { user } = useAuth();
  const { budgets, departments } = useBudget();
  const [selectedPeriod, setSelectedPeriod] = useState('current-year');

  // Calculate department spending data
  const departmentData = departments.map(dept => {
    const deptBudgets = budgets.filter(b => b.department === dept.name);
    const totalBudget = deptBudgets.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalSpent = deptBudgets.reduce((sum, b) => sum + b.spentAmount, 0);
    return {
      name: dept.name,
      budget: totalBudget,
      spent: totalSpent,
      remaining: totalBudget - totalSpent,
    };
  });

  // Bar chart data for department spending
  const barChartData = {
    labels: departmentData.map(d => d.name),
    datasets: [
      {
        label: 'Total Budget',
        data: departmentData.map(d => d.budget),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Spent',
        data: departmentData.map(d => d.spent),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Doughnut chart data for budget status
  const statusCounts = {
    approved: budgets.filter(b => b.status === 'APPROVED' || b.status === 'ACTIVE').length,
    pending: budgets.filter(b => b.status === 'PENDING').length,
    rejected: budgets.filter(b => b.status === 'REJECTED').length,
    draft: budgets.filter(b => b.status === 'DRAFT').length,
  };

  const doughnutData = {
    labels: ['Approved/Active', 'Pending', 'Rejected', 'Draft'],
    datasets: [
      {
        data: [statusCounts.approved, statusCounts.pending, statusCounts.rejected, statusCounts.draft],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Budget Overview',
      },
    },
  };

  // Calculate summary statistics
  const totalBudget = budgets.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      generatedBy: `${user?.firstName} ${user?.lastName}`,
      period: selectedPeriod,
      summary: {
        totalBudget,
        totalSpent,
        utilizationRate: utilizationRate.toFixed(2),
        totalBudgets: budgets.length,
      },
      departments: departmentData,
      budgets: budgets.map(b => ({
        name: b.name,
        department: b.department,
        category: b.category,
        totalAmount: b.totalAmount,
        spentAmount: b.spentAmount,
        status: b.status,
      })),
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `budget-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Budget performance and insights</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="current-year">Current Year</option>
            <option value="last-year">Last Year</option>
            <option value="current-quarter">Current Quarter</option>
            <option value="last-quarter">Last Quarter</option>
          </select>
          <button
            onClick={exportReport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Budget
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${totalBudget.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Spent
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${totalSpent.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Utilization Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {utilizationRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentArrowDownIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Budgets
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {budgets.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Spending Chart */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Department Budget vs Spending
          </h3>
          <div className="h-80">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Budget Status Distribution */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Budget Status Distribution
          </h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Department Performance
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Detailed breakdown by department
          </p>
        </div>
        <div className="border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departmentData.map((dept) => {
                const utilization = dept.budget > 0 ? (dept.spent / dept.budget) * 100 : 0;
                return (
                  <tr key={dept.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dept.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${dept.budget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${dept.spent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${dept.remaining.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-2">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                utilization > 90 ? 'bg-red-600' : 
                                utilization > 75 ? 'bg-yellow-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
