import React from 'react';
import CustomerList from '../components/CustomerList';

const CustomersPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <CustomerList title="All Customers" />
    </div>
  );
};

export default CustomersPage;