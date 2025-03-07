import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Customer, Field, PrintTemplate } from '../types';

interface CustomerContextType {
  customers: Customer[];
  fields: Field[];
  templates: PrintTemplate[];
  addCustomer: (customer: Omit<Customer, 'id' | 'joinId' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addField: (field: Omit<Field, 'id'>) => void;
  updateField: (id: string, field: Partial<Field>) => void;
  deleteField: (id: string) => void;
  addTemplate: (template: Omit<PrintTemplate, 'id'>) => void;
  updateTemplate: (id: string, template: Partial<PrintTemplate>) => void;
  deleteTemplate: (id: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const defaultFields: Field[] = [
  { id: uuidv4(), name: 'name', type: 'text', required: true },
  { id: uuidv4(), name: 'email', type: 'email', required: true },
  { id: uuidv4(), name: 'phone', type: 'text', required: true },
];

const defaultTemplates: PrintTemplate[] = [
  {
    id: uuidv4(),
    name: 'Default Template',
    header: 'Company Name\nAddress Line 1\nAddress Line 2\nPhone: **123-456-7890**',
    footer: 'Thank you for your business!'
  }
];

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [fields, setFields] = useState<Field[]>(() => {
    const saved = localStorage.getItem('fields');
    return saved ? JSON.parse(saved) : defaultFields;
  });

  const [templates, setTemplates] = useState<PrintTemplate[]>(() => {
    const saved = localStorage.getItem('templates');
    return saved ? JSON.parse(saved) : defaultTemplates;
  });

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('fields', JSON.stringify(fields));
  }, [fields]);

  useEffect(() => {
    localStorage.setItem('templates', JSON.stringify(templates));
  }, [templates]);

  const getNextJoinId = () => {
    const maxId = customers.reduce((max, customer) => {
      const num = parseInt(customer.joinId.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    const nextNum = maxId + 1;
    return `CUS-${String(nextNum).padStart(2, '0')}`;
  };

  const validateUniqueData = (data: Record<string, any>) => {
    return !customers.some(customer => 
      fields.every(field => 
        field.required && customer[field.name] === data[field.name]
      )
    );
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'joinId' | 'createdAt'>) => {
    if (!validateUniqueData(customer)) {
      throw new Error('A customer with identical required fields already exists');
    }

    const newCustomer: Customer = {
      ...customer,
      id: uuidv4(),
      joinId: getNextJoinId(),
      createdAt: new Date().toISOString(),
      status: customer.status || 'new',
      paid: customer.paid || false,
      priority: customer.priority || 'normal',
      amount: customer.amount || ''
    };
    setCustomers([...customers, newCustomer]);
  };

  const updateCustomer = (id: string, customer: Partial<Customer>) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...customer } : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
  };

  const addField = (field: Omit<Field, 'id'>) => {
    const newField: Field = {
      ...field,
      id: uuidv4()
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, field: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...field } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const addTemplate = (template: Omit<PrintTemplate, 'id'>) => {
    const newTemplate: PrintTemplate = {
      ...template,
      id: uuidv4()
    };
    setTemplates([...templates, newTemplate]);
  };

  const updateTemplate = (id: string, template: Partial<PrintTemplate>) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, ...template } : t));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        fields,
        templates,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addField,
        updateField,
        deleteField,
        addTemplate,
        updateTemplate,
        deleteTemplate
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};