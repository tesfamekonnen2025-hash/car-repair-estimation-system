import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewEstimation from './pages/NewEstimation';
import Estimations from './pages/Estimations';
import CarManagement from './pages/CarManagement';
import MaterialStock from './pages/MaterialStock';
import Reports from './pages/Reports';
import './styles.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="app">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/estimation/new" element={<NewEstimation />} />
          <Route path="/estimations" element={<Estimations />} />
          <Route path="/cars" element={<CarManagement />} />
          <Route path="/materials" element={<MaterialStock />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
