import React from 'react';
import PrintCustomer from '../components/PrintCustomer';
import { useCustomer } from '../context/CustomerContext';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

const PrintPage: React.FC = () => {
  const { customers } = useCustomer();

  const handleDownloadPDF = (customer: any) => {
    const doc = new jsPDF();
    const margin = 20;
    let yPos = margin;

    // Add title
    doc.setFontSize(20);
    doc.text('Customer Details', margin, yPos);
    yPos += 10;

    // Add date
    doc.setFontSize(12);
    doc.text(`Date Added: ${customer.dateAdded}`, margin, yPos);
    yPos += 10;

    // Add customer details
    doc.setFontSize(14);
    Object.entries(customer).forEach(([key, value]) => {
      // Skip internal fields and complex objects
      if (['id', 'joinId', 'checklist', 'checklistTitle'].includes(key)) return;
      if (typeof value === 'object') return;

      doc.text(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`, margin, yPos);
      yPos += 8;

      // Add new page if needed
      if (yPos > doc.internal.pageSize.height - margin) {
        doc.addPage();
        yPos = margin;
      }
    });

    // Add checklist if exists
    if (customer.checklist && customer.checklist.length > 0) {
      yPos += 10;
      doc.setFontSize(16);
      doc.text(customer.checklistTitle || 'Checklist', margin, yPos);
      yPos += 10;

      doc.setFontSize(12);
      customer.checklist.forEach((item: any) => {
        const checkmark = item.completed ? '☑' : '☐';
        doc.text(`${checkmark} ${item.text}`, margin, yPos);
        yPos += 8;

        if (yPos > doc.internal.pageSize.height - margin) {
          doc.addPage();
          yPos = margin;
        }
      });
    }

    // Save the PDF
    doc.save(`customer-${customer.joinId}-${customer.dateAdded}.pdf`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <PrintCustomer onDownloadPDF={handleDownloadPDF} />
      </div>
    </div>
  );
};

export default PrintPage;