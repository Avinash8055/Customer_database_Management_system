import React from 'react';
import { NavLink } from 'react-router-dom';
import { Database, Users, Clock, CheckCircle, Printer } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <span className="text-xl font-bold">Customer DB</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center space-x-1 hover:text-blue-300 ${isActive ? 'text-blue-400' : ''}`
              }
              end
            >
              <Users className="h-5 w-5" />
              <span>Entry</span>
            </NavLink>
            <NavLink 
              to="/customers" 
              className={({ isActive }) => 
                `flex items-center space-x-1 hover:text-blue-300 ${isActive ? 'text-blue-400' : ''}`
              }
            >
              <Database className="h-5 w-5" />
              <span>All Customers</span>
            </NavLink>
            <NavLink 
              to="/in-progress" 
              className={({ isActive }) => 
                `flex items-center space-x-1 hover:text-blue-300 ${isActive ? 'text-blue-400' : ''}`
              }
            >
              <Clock className="h-5 w-5" />
              <span>In Progress</span>
            </NavLink>
            <NavLink 
              to="/completed" 
              className={({ isActive }) => 
                `flex items-center space-x-1 hover:text-blue-300 ${isActive ? 'text-blue-400' : ''}`
              }
            >
              <CheckCircle className="h-5 w-5" />
              <span>Completed</span>
            </NavLink>
            <NavLink 
              to="/print" 
              className={({ isActive }) => 
                `flex items-center space-x-1 hover:text-blue-300 ${isActive ? 'text-blue-400' : ''}`
              }
            >
              <Printer className="h-5 w-5" />
              <span>Print</span>
            </NavLink>
          </div>
          <div className="md:hidden">
            {/* Mobile menu button would go here */}
            <button className="text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;