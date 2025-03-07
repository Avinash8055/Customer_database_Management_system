import React, { useState, useRef, useEffect } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { Customer, PrintTemplate, Field } from '../types';
import { Search, Save, Plus, Check, Download, Upload, Database, Bold, Italic, Underline } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

interface PrintCustomerProps {
  onDownloadPDF: (customer: Customer) => void;
}

interface EditableField {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderlined: boolean;
}

interface EditableContent {
  [key: string]: EditableField;
}

const PrintCustomer: React.FC<PrintCustomerProps> = ({ onDownloadPDF }) => {
  const { customers, fields, templates, addTemplate, updateTemplate, deleteTemplate } = useCustomer();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0]?.id || '');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Omit<PrintTemplate, 'id'>>({
    name: '',
    header: '',
    footer: ''
  });
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);
  const [customHeader, setCustomHeader] = useState('');
  const [customFooter, setCustomFooter] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [defaultFieldsConfig, setDefaultFieldsConfig] = useState<string[]>([]);
  const [useDefaultFields, setUseDefaultFields] = useState(true);
  const [showSaveFieldsSuccess, setShowSaveFieldsSuccess] = useState(false);
  const [showJoinId, setShowJoinId] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 50 * 1024 * 1024 }); // 50MB limit
  const [editableContent, setEditableContent] = useState<EditableContent>({});
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calculate storage usage
    const customersSize = new Blob([JSON.stringify(customers)]).size;
    const fieldsSize = new Blob([JSON.stringify(fields)]).size;
    const templatesSize = new Blob([JSON.stringify(templates)]).size;
    const totalUsed = customersSize + fieldsSize + templatesSize;
    setStorageUsage(prev => ({ ...prev, used: totalUsed }));
  }, [customers, fields, templates]);

  useEffect(() => {
    const savedDefaultFields = localStorage.getItem('defaultPrintFields');
    if (savedDefaultFields) {
      const parsedFields = JSON.parse(savedDefaultFields);
      setDefaultFieldsConfig(parsedFields);
      if (useDefaultFields) {
        setSelectedFields(parsedFields);
      }
    } else {
      const allFieldNames = fields.map(field => field.name);
      setDefaultFieldsConfig(allFieldNames);
      setSelectedFields(allFieldNames);
    }
    
    const savedShowJoinId = localStorage.getItem('showJoinId');
    if (savedShowJoinId !== null) {
      setShowJoinId(JSON.parse(savedShowJoinId));
    }
  }, [fields, useDefaultFields]);

  useEffect(() => {
    localStorage.setItem('showJoinId', JSON.stringify(showJoinId));
  }, [showJoinId]);

  const handleExportData = () => {
    const data = {
      customers,
      fields,
      templates
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'customer-database-export.json');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Check if imported data would exceed storage limit
        const dataSize = new Blob([JSON.stringify(data)]).size;
        if (dataSize > storageUsage.total) {
          alert('Import failed: Data size exceeds storage limit');
          return;
        }
        
        localStorage.setItem('customers', JSON.stringify(data.customers));
        localStorage.setItem('fields', JSON.stringify(data.fields));
        localStorage.setItem('templates', JSON.stringify(data.templates));
        window.location.reload();
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleFormatText = (format: 'bold' | 'italic' | 'underline') => {
    if (!selectedField) return;
    
    setEditableContent(prev => ({
      ...prev,
      [selectedField]: {
        ...prev[selectedField],
        isBold: format === 'bold' ? !prev[selectedField].isBold : prev[selectedField].isBold,
        isItalic: format === 'italic' ? !prev[selectedField].isItalic : prev[selectedField].isItalic,
        isUnderlined: format === 'underline' ? !prev[selectedField].isUnderlined : prev[selectedField].isUnderlined,
      }
    }));
  };

  const initializeEditableContent = (customer: Customer) => {
    const content: EditableContent = {};
    fields.forEach(field => {
      if (selectedFields.includes(field.name)) {
        content[field.name] = {
          text: customer[field.name] || 'N/A',
          isBold: false,
          isItalic: false,
          isUnderlined: false
        };
      }
    });
    
    if (selectedFields.includes('status')) {
      content['status'] = {
        text: customer.status === 'new' ? 'New' : 
              customer.status === 'in-progress' ? 'In Progress' : 'Completed',
        isBold: false,
        isItalic: false,
        isUnderlined: false
      };
    }
    
    if (selectedFields.includes('payment')) {
      content['payment'] = {
        text: customer.paid ? 'Paid' : 'Unpaid',
        isBold: false,
        isItalic: false,
        isUnderlined: false
      };
    }
    
    if (selectedFields.includes('priority')) {
      content['priority'] = {
        text: customer.priority || 'Normal',
        isBold: false,
        isItalic: false,
        isUnderlined: false
      };
    }
    
    if (selectedFields.includes('amount')) {
      content['amount'] = {
        text: customer.amount ? `₹${customer.amount}` : 'N/A',
        isBold: false,
        isItalic: false,
        isUnderlined: false
      };
    }
    
    setEditableContent(content);
  };

  useEffect(() => {
    if (selectedCustomer) {
      initializeEditableContent(selectedCustomer);
    }
  }, [selectedCustomer, selectedFields]);

  const handleSaveAsWord = async () => {
    if (!selectedCustomer) return;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: useCustomText ? customHeader : currentTemplate?.header || '',
                break: 2
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '', break: 2 })
            ]
          }),
          ...(showJoinId ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Job Number: ${selectedCustomer.joinId}`,
                  bold: editableContent['joinId']?.isBold,
                  italics: editableContent['joinId']?.isItalic,
                  underline: editableContent['joinId']?.isUnderlined ? { type: 'single' } : undefined,
                  break: 1
                })
              ]
            })
          ] : []),
          ...Object.entries(editableContent).map(([fieldName, field]: [string, EditableField]) => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: `,
                  bold: true
                }),
                new TextRun({
                  text: field.text,
                  bold: field.isBold,
                  italics: field.isItalic,
                  underline: field.isUnderlined ? { type: 'single' } : undefined,
                  break: 1
                })
              ],
              spacing: {
                after: 200
              }
            })
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: useCustomText ? customFooter : currentTemplate?.footer || '',
                break: 2
              })
            ]
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `customer-${selectedCustomer.joinId}.docx`);
  };

  const handleDownloadPDF = (customer: Customer) => {
    // Implementation of handleDownloadPDF method
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.joinId.toLowerCase().includes(searchLower)
    );
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchTerm('');
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name) {
      alert('Template name is required');
      return;
    }
    
    addTemplate(newTemplate);
    setNewTemplate({
      name: '',
      header: '',
      footer: ''
    });
    setShowTemplateModal(false);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    
    if (!editingTemplate.name) {
      alert('Template name is required');
      return;
    }
    
    if (editingTemplate.id === templates[0]?.id) {
      const updatedTemplate = {
        ...editingTemplate,
        name: "Default Template"
      };
      updateTemplate(editingTemplate.id, updatedTemplate);
    } else {
      updateTemplate(editingTemplate.id, editingTemplate);
    }
    
    setEditingTemplate(null);
    setShowTemplateModal(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (id === templates[0]?.id) {
      alert('The default template cannot be deleted.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id);
      if (selectedTemplate === id) {
        setSelectedTemplate(templates.find(t => t.id !== id)?.id || '');
      }
    }
  };

  const handleEditTemplate = (template: PrintTemplate) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleFieldToggle = (fieldName: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldName)
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
    setUseDefaultFields(false);
  };

  const handleSaveDefaultFields = () => {
    localStorage.setItem('defaultPrintFields', JSON.stringify(selectedFields));
    setDefaultFieldsConfig(selectedFields);
    setShowSaveFieldsSuccess(true);
    setTimeout(() => setShowSaveFieldsSuccess(false), 3000);
  };

  const handleUseDefaultFields = () => {
    setUseDefaultFields(true);
    setSelectedFields(defaultFieldsConfig);
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);
  const isDefaultTemplate = selectedTemplate === templates[0]?.id;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Print Customer Data</h2>
          <div className="text-sm text-gray-600 mt-2 flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Storage Usage: {(storageUsage.used / 1024 / 1024).toFixed(2)}MB / {(storageUsage.total / 1024 / 1024).toFixed(2)}MB
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleExportData}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Select Customer</h3>
          
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search by name, phone, or ID..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          {searchTerm && (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md mb-6">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">No customers found</div>
              ) : (
                <ul>
                  {filteredCustomers.map(customer => (
                    <li 
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-600">
                        {customer.phone} | ID: {customer.joinId}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          <h3 className="text-lg font-semibold mb-4">Print Settings</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Fields to Display
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUseDefaultFields}
                    className={`text-xs px-2 py-1 rounded ${useDefaultFields ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  >
                    Use Default
                  </button>
                  <button
                    onClick={handleSaveDefaultFields}
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                  >
                    Save as Default
                  </button>
                </div>
              </div>
              
              {showSaveFieldsSuccess && (
                <div className="flex items-center text-green-600 text-sm mb-2">
                  <Check className="h-4 w-4 mr-1" />
                  Default fields saved successfully!
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-md p-3 bg-gray-50">
                <div className="flex items-center col-span-2 mb-2 pb-2 border-b border-gray-200">
                  <input
                    type="checkbox"
                    id="field-joinId"
                    checked={showJoinId}
                    onChange={(e) => setShowJoinId(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="field-joinId" className="ml-2 block text-sm text-gray-700 font-medium">
                    Show Job Number (ID)
                  </label>
                </div>
                
                {fields.map(field => (
                  <div key={field.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`field-${field.id}`}
                      checked={selectedFields.includes(field.name)}
                      onChange={() => handleFieldToggle(field.name)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`field-${field.id}`} className="ml-2 block text-sm text-gray-700">
                      {field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                    </label>
                  </div>
                ))}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="field-status"
                    checked={selectedFields.includes('status')}
                    onChange={() => handleFieldToggle('status')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="field-status" className="ml-2 block text-sm text-gray-700">
                    Status
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="field-payment"
                    checked={selectedFields.includes('payment')}
                    onChange={() => handleFieldToggle('payment')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="field-payment" className="ml-2 block text-sm text-gray-700">
                    Payment Status
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="field-priority"
                    checked={selectedFields.includes('priority')}
                    onChange={() => handleFieldToggle('priority')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="field-priority" className="ml-2 block text-sm text-gray-700">
                    Priority
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="field-amount"
                    checked={selectedFields.includes('amount')}
                    onChange={() => handleFieldToggle('amount')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="field-amount" className="ml-2 block text-sm text-gray-700">
                    Amount
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <div className="flex items-center">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setShowTemplateModal(true);
                  }}
                  className="ml-2 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
                  title="Add New Template"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEditTemplate(currentTemplate!)}
                  className="ml-2 bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition"
                  title="Edit Template"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                {templates.length > 1 && !isDefaultTemplate && (
                  <button
                    onClick={() => handleDeleteTemplate(selectedTemplate)}
                    className="ml-2 bg-red-600 text-white p-2 rounded-md hover:bg-red-700 transition"
                    title="Delete Template"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useCustomText"
                checked={useCustomText}
                onChange={(e) => setUseCustomText(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useCustomText" className="ml-2 block text-sm text-gray-700">
                Use custom header/footer
              </label>
            </div>
            
            {useCustomText && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Header
                  </label>
                  <textarea
                    value={customHeader}
                    onChange={(e) => setCustomHeader(e.target.value)}
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-mono"
                    placeholder="Enter custom header text"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Footer
                  </label>
                  <textarea
                    value={customFooter}
                    onChange={(e) => setCustomFooter(e.target.value)}
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-mono"
                    placeholder="Enter custom footer text"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleSaveAsWord}
              disabled={!selectedCustomer}
              className={`flex items-center px-4 py-2 rounded-md transition ${
                selectedCustomer
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="h-5 w-5 mr-2" />
              Download as Word
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          
          <div 
            ref={printRef}
            className="border border-gray-300 rounded-md p-8 min-h-[700px] bg-white flex flex-col"
            style={{ position: 'relative' }}
          >
            {selectedCustomer ? (
              <div className="flex flex-col h-full">
                <div className="text-center whitespace-pre-wrap" style={{ whiteSpace: 'pre-wrap' }}>
                  {useCustomText ? customHeader : currentTemplate?.header}
                </div>
                
                <div className="py-6 flex-grow">
                  {isEditing && (
                    <div className="mb-4 flex space-x-2 border-b pb-2">
                      <button
                        onClick={() => handleFormatText('bold')}
                        className={`p-2 rounded ${selectedField && editableContent[selectedField]?.isBold ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleFormatText('italic')}
                        className={`p-2 rounded ${selectedField && editableContent[selectedField]?.isItalic ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleFormatText('underline')}
                        className={`p-2 rounded ${selectedField && editableContent[selectedField]?.isUnderlined ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                      >
                        <Underline className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="space-y-4">
                    {showJoinId && (
                      <div>
                        <span className="font-medium">Job Number:</span>{' '}
                        <span
                          onClick={() => {
                            setSelectedField('joinId');
                            setIsEditing(true);
                          }}
                          className={`cursor-text ${
                            editableContent['joinId']?.isBold ? 'font-bold' : ''
                          } ${editableContent['joinId']?.isItalic ? 'italic' : ''} ${
                            editableContent['joinId']?.isUnderlined ? 'underline' : ''
                          }`}
                        >
                          {selectedCustomer?.joinId}
                        </span>
                      </div>
                    )}
                    
                    {Object.entries(editableContent).map(([fieldName, field]: [string, EditableField]) => (
                      <div key={fieldName}>
                        <span className="font-medium">{fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}:</span>{' '}
                        <span
                          onClick={() => {
                            setSelectedField(fieldName);
                            setIsEditing(true);
                          }}
                          className={`cursor-text ${field.isBold ? 'font-bold' : ''} ${
                            field.isItalic ? 'italic' : ''
                          } ${field.isUnderlined ? 'underline' : ''}`}
                        >
                          {field.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div 
                  className="text-center whitespace-pre-wrap" 
                  style={{ 
                    position: 'absolute',
                    bottom: '4em',
                    left: 0,
                    right: 0,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {useCustomText ? customFooter : currentTemplate?.footer}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a customer to see preview
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingTemplate ? 'Edit Template' : 'Add New Template'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={editingTemplate ? editingTemplate.name : newTemplate.name}
                  onChange={(e) => 
                    editingTemplate 
                      ? setEditingTemplate({ ...editingTemplate, name: e.target.value }) 
                      : setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                  disabled={editingTemplate && editingTemplate.id === templates[0]?.id}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow- sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 ${
                    editingTemplate && editingTemplate.id === templates[0]?.id ? 'bg-gray-100' : ''
                  }`}
                  placeholder="e.g., Standard Template, Invoice Template, etc."
                />
                {editingTemplate && editingTemplate.id === templates[0]?.id && (
                  <p className="text-xs text-amber-600 mt-1">Default template name cannot be changed.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Header
                </label>
                <textarea
                  value={editingTemplate ? editingTemplate.header : newTemplate.header}
                  onChange={(e) => 
                    editingTemplate 
                      ? setEditingTemplate({ ...editingTemplate, header: e.target.value }) 
                      : setNewTemplate({ ...newTemplate, header: e.target.value })
                  }
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-mono"
                  placeholder="Enter header text"
                />
                <p className="text-xs text-gray-500 mt-1">Use line breaks for multiple lines. Spaces will be preserved exactly as entered.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Footer
                </label>
                <textarea
                  value={editingTemplate ? editingTemplate.footer : newTemplate.footer}
                  onChange={(e) => 
                    editingTemplate 
                      ? setEditingTemplate({ ...editingTemplate, footer: e.target.value }) 
                      : setNewTemplate({ ...newTemplate, footer: e.target.value })
                  }
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-mono"
                  placeholder="Enter footer text"
                />
                <p className="text-xs text-gray-500 mt-1">Use line breaks for multiple lines. Spaces will be preserved exactly as entered.</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowTemplateModal(false);
                  setEditingTemplate(null);
                  setNewTemplate({
                    name: '',
                    header: '',
                    footer: ''
                  });
                }}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={editingTemplate ? handleUpdateTemplate : handleAddTemplate}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                {editingTemplate ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintCustomer;
