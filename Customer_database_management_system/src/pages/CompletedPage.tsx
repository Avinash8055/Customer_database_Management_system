import React from 'react';
import CustomerList from '../components/CustomerList';

const CompletedPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <CustomerList status="completed" title="Completed Customers" />
    </div>
  );
};

export default CompletedPage;