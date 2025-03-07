import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CustomerProvider } from './context/CustomerContext';
import Navbar from './components/Navbar';
import EntryPage from './pages/EntryPage';
import CustomersPage from './pages/CustomersPage';
import InProgressPage from './pages/InProgressPage';
import CompletedPage from './pages/CompletedPage';
import PrintPage from './pages/PrintPage';

function App() {
  return (
    <CustomerProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <main className="py-6">
            <Routes>
              <Route path="/" element={<EntryPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/in-progress" element={<InProgressPage />} />
              <Route path="/completed" element={<CompletedPage />} />
              <Route path="/print" element={<PrintPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </CustomerProvider>
  );
}

export default App;