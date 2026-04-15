import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  ClipboardList,
  Car,
  Package,
  BarChart3,
  Menu,
  X,
  Settings
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/estimation/new', icon: Calculator, label: 'New Estimation' },
    { path: '/estimations', icon: ClipboardList, label: 'Estimations' },
    { path: '/cars', icon: Car, label: 'Car Management' },
    { path: '/materials', icon: Package, label: 'Materials & Stock' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <Car size={32} className="logo-icon" />
          <h1 className="sidebar-title">Car Repair Estimation</h1>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Settings size={18} />
          <span>System Settings</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
