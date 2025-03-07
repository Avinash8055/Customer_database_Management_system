import React from 'react';
import CustomerList from '../components/CustomerList';

const InProgressPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <CustomerList status="in-progress" includeNew={true} title="New & In Progress Customers" />
    </div>
  );
};

export default InProgressPage;