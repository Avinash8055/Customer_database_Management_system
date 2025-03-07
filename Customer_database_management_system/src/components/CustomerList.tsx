import React, { useState, useEffect } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { Customer, Field, ChecklistItem } from '../types';
import { Search, ChevronDown, ChevronUp, Edit, Trash2, CheckCircle, Clock, DollarSign, Flag, ListChecks, Plus, X } from 'lucide-react';

interface CustomerListProps {
  status?: 'new' | 'in-progress' | 'completed';
  title?: string;
  includeNew?: boolean;
}

const CustomerList: React.FC<CustomerListProps> = ({ status, title = 'All Customers', includeNew }) => {
  const { customers, fields, updateCustomer, deleteCustomer } = useCustomer();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [totalAmount, setTotalAmount] = useState<string>('0');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [checklistTitle, setChecklistTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredCustomers = customers
    .filter(customer => {
      if (status) {
        if (includeNew && status === 'in-progress') {
          return customer.status === 'new' || customer.status === 'in-progress';
        }
        return customer.status === status;
      }
      return true;
    })
    .filter(customer => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower) ||
        customer.joinId.toLowerCase().includes(searchLower)
      );
    });

  // Calculate total amount and paid amount
  useEffect(() => {
    const total = filteredCustomers.reduce((sum, customer) => {
      const amount = customer.amount ? parseFloat(customer.amount) : 0;
      return sum + amount;
    }, 0);
    
    const paid = filteredCustomers.reduce((sum, customer) => {
      if (customer.paid) {
        const amount = customer.amount ? parseFloat(customer.amount) : 0;
        return sum + amount;
      }
      return sum;
    }, 0);
    
    // Format the amounts with Indian currency notation (K for thousands, L for lakhs, C for crores)
    const formatAmount = (amount: number) => {
      if (amount >= 10000000) { // 1 crore = 10,000,000
        return `₹${(amount / 10000000).toFixed(2)}C`;
      } else if (amount >= 100000) { // 1 lakh = 100,000
        return `₹${(amount / 100000).toFixed(2)}L`;
      } else if (amount >= 1000) { // 1 thousand = 1,000
        return `₹${(amount / 1000).toFixed(2)}K`;
      } else {
        return `₹${amount.toFixed(2)}`;
      }
    };
    
    setPaidAmount(formatAmount(paid));
    setTotalAmount(formatAmount(total));
  }, [filteredCustomers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleExpand = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const handleStatusChange = (customer: Customer, newStatus: 'new' | 'in-progress' | 'completed') => {
    updateCustomer(customer.id, { status: newStatus });
  };

  const handlePaymentChange = (customer: Customer) => {
    updateCustomer(customer.id, { paid: !customer.paid });
  };

  const handleDelete = (customerId: string) => {
    deleteCustomer(customerId);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({ ...customer });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    });
  };

  const handleSaveEdit = () => {
    if (!editingCustomer) return;
    
    // Validate required fields
    const missingFields = fields
      .filter(field => field.required)
      .filter(field => !editFormData[field.name]);
    
    if (missingFields.length > 0) {
      setFormError(`Please fill in the following required fields: ${missingFields.map(f => f.name).join(', ')}`);
      return;
    }
    
    updateCustomer(editingCustomer.id, editFormData);
    setEditingCustomer(null);
    setFormError(null);
  };

  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'normal': return 'bg-green-100 text-green-800';
      case 'high': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const openChecklist = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setActiveCustomerId(customerId);
    setChecklistTitle(customer?.checklistTitle || '');
    setShowChecklistModal(true);
  };

  const handleAddChecklistItem = () => {
    if (!activeCustomerId || !newChecklistItem.trim()) return;
    
    const customer = customers.find(c => c.id === activeCustomerId);
    if (!customer) return;
    
    const checklist: ChecklistItem[] = customer.checklist || [];
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newChecklistItem.trim(),
      completed: false
    };
    
    updateCustomer(activeCustomerId, { 
      checklist: [...checklist, newItem],
      checklistTitle: checklistTitle
    });
    
    setNewChecklistItem('');
  };

  const handleToggleChecklistItem = (customerId: string, itemId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !customer.checklist) return;
    
    const updatedChecklist = customer.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    
    updateCustomer(customerId, { checklist: updatedChecklist });
  };

  const handleDeleteChecklistItem = (customerId: string, itemId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !customer.checklist) return;
    
    const updatedChecklist = customer.checklist.filter(item => item.id !== itemId);
    
    updateCustomer(customerId, { checklist: updatedChecklist });
  };

  const getActiveCustomer = () => {
    return customers.find(c => c.id === activeCustomerId);
  };

  const handleSaveChecklistTitle = () => {
    if (!activeCustomerId) return;
    
    updateCustomer(activeCustomerId, { checklistTitle });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {title === 'All Customers' && (
            <div className="text-lg font-medium text-gray-600 mt-1">
              Total Amount: <span className="text-green-600">{paidAmount}</span> / <span className="text-blue-600">{totalAmount}</span>
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, phone, or ID..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No customers found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(customer.id)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.joinId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.amount ? `₹${customer.amount}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(customer.priority)}`}>
                        {customer.priority || 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${customer.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                          customer.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {customer.status === 'new' ? 'New' : 
                         customer.status === 'in-progress' ? 'In Progress' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${customer.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {customer.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Customer"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openChecklist(customer.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="View Checklist"
                        >
                          <ListChecks className="h-5 w-5" />
                        </button>
                        {customer.status !== 'in-progress' && (
                          <button
                            onClick={() => handleStatusChange(customer, 'in-progress')}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Mark as In Progress"
                          >
                            <Clock className="h-5 w-5" />
                          </button>
                        )}
                        {customer.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(customer, 'completed')}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePaymentChange(customer)}
                          className={`${customer.paid ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'}`}
                          title={customer.paid ? "Mark as Unpaid" : "Mark as Paid"}
                        >
                          <DollarSign className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedCustomer === customer.id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {fields.map((field) => (
                            <div key={field.id} className="mb-2">
                              <span className="font-medium text-gray-700">{field.name}: </span>
                              <span className="text-gray-900">{customer[field.name] || 'N/A'}</span>
                            </div>
                          ))}
                          
                          {/* Show checklist in expanded view if it exists */}
                          {customer.checklist && customer.checklist.length > 0 && (
                            <div className="col-span-2 md:col-span-3 mt-2 border-t pt-2">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-700">
                                  {customer.checklistTitle || 'Checklist'}:
                                </h4>
                                <button
                                  onClick={() => openChecklist(customer.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Edit
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {customer.checklist.map(item => (
                                  <div key={item.id} className="flex items-center">
                                    <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                      • {item.text} {item.completed ? '(Completed)' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Edit Customer</h3>
            
            {/* Form Error Message */}
            {formError && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                {formError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={editFormData[field.name] || ''}
                      onChange={handleEditInputChange}
                      required={field.required}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      name={field.name}
                      value={editFormData[field.name] || ''}
                      onChange={handleEditInputChange}
                      required={field.required}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    />
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={editFormData[field.name] || ''}
                      onChange={handleEditInputChange}
                      required={field.required}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder={`Enter ${field.name}`}
                    />
                  )}
                </div>
              ))}

              {/* Amount Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={editFormData.amount || ''}
                  onChange={handleEditInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  placeholder="Enter amount"
                />
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={editFormData.status || 'new'}
                  onChange={handleEditInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={editFormData.priority || 'normal'}
                  onChange={handleEditInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <div className="flex items-center mt-5">
                  <input
                    type="checkbox"
                    id="edit-paid"
                    name="paid"
                    checked={editFormData.paid || false}
                    onChange={handleEditInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit-paid" className="ml-2 block text-sm text-gray-700">
                    Payment Received
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(null);
                  setFormError(null);
                }}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Modal */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Checklist for {getActiveCustomer()?.name}
              </h3>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Checklist Title
              </label>
              <input
                type="text"
                value={checklistTitle}
                onChange={(e) => setChecklistTitle(e.target.value)}
                onBlur={handleSaveChecklistTitle}
                placeholder="Enter checklist title (optional)"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
            
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add new checklist item"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddChecklistItem();
                    }
                  }}
                />
                <button
                  onClick={handleAddChecklistItem}
                  className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {getActiveCustomer()?.checklist?.length ? (
                getActiveCustomer()?.checklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(activeCustomerId!, item.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className={item.completed ? 'line-through text-gray-500' : ''}>
                        {item.text}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteChecklistItem(activeCustomerId!, item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No checklist items yet. Add some above!
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
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

export default CustomerList;