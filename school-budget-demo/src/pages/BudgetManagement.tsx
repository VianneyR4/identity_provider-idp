import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../contexts/BudgetContext';
import { Budget } from '../types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const BudgetManagement: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { budgets, departments, createBudget, updateBudget, deleteBudget, approveBudget, rejectBudget } = useBudget();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalAmount: '',
    department: '',
    category: '',
    startDate: '',
    endDate: '',
  });

  const categories = [
    'Educational Materials',
    'Equipment',
    'Infrastructure',
    'Professional Development',
    'Events & Activities',
    'Maintenance',
    'Technology',
    'Other'
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      totalAmount: '',
      department: '',
      category: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createBudget({
      ...formData,
      totalAmount: parseFloat(formData.totalAmount),
    });
    if (success) {
      setShowCreateModal(false);
      resetForm();
    }
  };

  const handleEditBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    
    const success = await updateBudget(editingBudget.id, {
      ...formData,
      totalAmount: parseFloat(formData.totalAmount),
    });
    if (success) {
      setEditingBudget(null);
      resetForm();
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      description: budget.description,
      totalAmount: budget.totalAmount.toString(),
      department: budget.department,
      category: budget.category,
      startDate: budget.startDate.split('T')[0],
      endDate: budget.endDate.split('T')[0],
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(id);
    }
  };

  const handleApprove = async (id: number) => {
    await approveBudget(id);
  };

  const handleReject = async (id: number) => {
    await rejectBudget(id);
  };

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

  const canEdit = (budget: Budget) => {
    return hasRole('ADMIN') || 
           (hasRole('DEPARTMENT_HEAD') && budget.department === user?.firstName) ||
           budget.createdBy.id === user?.id;
  };

  const canApprove = (budget: Budget) => {
    return hasRole('ADMIN') || hasRole('DEPARTMENT_HEAD');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Budget
        </button>
      </div>

      {/* Budget List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {budgets.map((budget) => (
            <li key={budget.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {budget.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                      {budget.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{budget.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{budget.department}</span>
                    <span>•</span>
                    <span>{budget.category}</span>
                    <span>•</span>
                    <span>${budget.totalAmount.toLocaleString()}</span>
                    <span>•</span>
                    <span>Spent: ${budget.spentAmount.toLocaleString()}</span>
                  </div>
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewingBudget(budget)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  {canEdit(budget) && (
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                  {canApprove(budget) && budget.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(budget.id)}
                        className="p-2 text-green-400 hover:text-green-600"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReject(budget.id)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {canEdit(budget) && budget.status === 'DRAFT' && (
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingBudget) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingBudget ? 'Edit Budget' : 'Create New Budget'}
            </h3>
            <form onSubmit={editingBudget ? handleEditBudget : handleCreateBudget}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingBudget(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingBudget && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Details</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Name:</span> {viewingBudget.name}
              </div>
              <div>
                <span className="font-medium">Description:</span> {viewingBudget.description}
              </div>
              <div>
                <span className="font-medium">Department:</span> {viewingBudget.department}
              </div>
              <div>
                <span className="font-medium">Category:</span> {viewingBudget.category}
              </div>
              <div>
                <span className="font-medium">Total Amount:</span> ${viewingBudget.totalAmount.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Spent Amount:</span> ${viewingBudget.spentAmount.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Remaining:</span> ${viewingBudget.remainingAmount.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewingBudget.status)}`}>
                  {viewingBudget.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Created By:</span> {viewingBudget.createdBy.firstName} {viewingBudget.createdBy.lastName}
              </div>
              <div>
                <span className="font-medium">Period:</span> {new Date(viewingBudget.startDate).toLocaleDateString()} - {new Date(viewingBudget.endDate).toLocaleDateString()}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewingBudget(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;
