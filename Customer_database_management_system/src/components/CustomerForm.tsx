import React, { useState, useEffect } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { Field, ChecklistItem } from '../types';
import { Plus, Settings, X, Check, Edit } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CustomerFormProps {
  checklist?: ChecklistItem[];
  checklistTitle?: string;
  onSubmitSuccess?: () => void;
}

interface FormData {
  [key: string]: string | boolean | number;
  status: string;
  paid: boolean;
  priority: string;
  amount: string;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  checklist,
  checklistTitle,
  onSubmitSuccess,
}) => {
  const { fields, addCustomer, addField, updateField, deleteField } = useCustomer();
  const [formData, setFormData] = useState<FormData>({
    status: 'new',
    paid: false,
    priority: 'normal',
    amount: ''
  });
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newField, setNewField] = useState<Omit<Field, 'id'>>({
    name: '',
    type: 'text',
    required: false,
    options: []
  });
  const [newOption, setNewOption] = useState('');
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleInputChange = (field: Field, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field.name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const customerData = {
      ...formData,
      entryDate: new Date().toISOString().split('T')[0],
      checklist: checklist || [],
      checklistTitle: checklistTitle || '',
      status: 'new',
      paid: false,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    await addCustomer(customerData);
    setFormData({
      status: 'new',
      paid: false,
      priority: 'normal',
      amount: ''
    });
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    onSubmitSuccess?.();
  };

  const handleAddField = () => {
    if (!newField.name) return;
    
    addField(newField);
    setNewField({
      name: '',
      type: 'text',
      required: false,
      options: []
    });
    setShowFieldModal(false);
  };

  const handleSaveField = () => {
    if (!editingField) return;
    
    updateField(editingField.id, editingField);
    setEditingField(null);
    setShowFieldModal(false);
  };

  const handleAddOption = () => {
    if (!newOption) return;
    
    if (editingField) {
      setEditingField({
        ...editingField,
        options: [...(editingField.options || []), newOption]
      });
    } else {
      setNewField({
        ...newField,
        options: [...(newField.options || []), newOption]
      });
    }
    setNewOption('');
  };

  const handleRemoveOption = (option: string) => {
    if (editingField) {
      setEditingField({
        ...editingField,
        options: editingField.options?.filter(o => o !== option)
      });
    } else {
      setNewField({
        ...newField,
        options: newField.options?.filter(o => o !== option)
      });
    }
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setShowFieldModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add New Customer</h2>
        <button
          onClick={() => setShowFieldModal(true)}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
        >
          <Settings className="h-5 w-5" />
          <span>Add New Field</span>
        </button>
      </div>

      {showSuccessMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md flex items-center">
          <Check className="h-5 w-5 mr-2" />
          Customer added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => (
            <div key={field.id} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="relative">
                {field.type === 'select' ? (
                  <select
                    value={String(formData[field.name] || '')}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 pr-10"
                    required={field.required}
                  >
                    <option value="">Select {field.name}</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={String(formData[field.name] || '')}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 pr-10"
                    placeholder={`Enter ${field.name}`}
                    required={field.required}
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleEditField(field)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={(e) => handleInputChange({ id: 'amount', name: 'amount', type: 'number', required: false }, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              placeholder="Enter amount (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange({ id: 'priority', name: 'priority', type: 'text', required: true }, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              required
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
          >
            Add Customer
          </button>
        </div>
      </form>

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingField ? 'Edit Field' : 'Add New Field'}
              </h3>
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  setEditingField(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  value={editingField ? editingField.name : newField.name}
                  onChange={(e) => {
                    if (editingField) {
                      setEditingField({ ...editingField, name: e.target.value });
                    } else {
                      setNewField({ ...newField, name: e.target.value });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  placeholder="Enter field name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={editingField ? editingField.type : newField.type}
                  onChange={(e) => {
                    if (editingField) {
                      setEditingField({ ...editingField, type: e.target.value as Field['type'] });
                    } else {
                      setNewField({ ...newField, type: e.target.value as Field['type'] });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="select">Select</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={editingField ? editingField.required : newField.required}
                  onChange={(e) => {
                    if (editingField) {
                      setEditingField({ ...editingField, required: e.target.checked });
                    } else {
                      setNewField({ ...newField, required: e.target.checked });
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
                  Required field
                </label>
              </div>
              
              {(editingField?.type === 'select' || newField.type === 'select') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Add option"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(editingField ? editingField.options : newField.options)?.map((option) => (
                      <div key={option} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <span>{option}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(option)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between mt-6">
              {editingField && (
                <button
                  type="button"
                  onClick={() => {
                    if (editingField) {
                      deleteField(editingField.id);
                      setShowFieldModal(false);
                      setEditingField(null);
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                >
                  Delete Field
                </button>
              )}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFieldModal(false);
                    setEditingField(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={editingField ? handleSaveField : handleAddField}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  {editingField ? 'Save Changes' : 'Add Field'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerForm;