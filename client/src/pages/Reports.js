import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Download,
  Calendar,
  DollarSign,
  Package,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  FileText,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import AlertBanner from '../components/AlertBanner';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [estimations, setEstimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportType, setReportType] = useState('summary');

  useEffect(() => {
    fetchDashboardStats();
    fetchEstimations();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error fetching report data' }]);
    }
  };

  const fetchEstimations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      
      const response = await axios.get('/api/estimations', { params });
      setEstimations(response.data);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error fetching estimations' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchEstimations();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  const getRevenueByWorkType = () => {
    const workTypes = {};
    estimations
      .filter(e => e.status === 'confirmed' || e.status === 'completed')
      .forEach(est => {
        if (!workTypes[est.workType]) {
          workTypes[est.workType] = { count: 0, revenue: 0 };
        }
        workTypes[est.workType].count += 1;
        workTypes[est.workType].revenue += est.totalCost;
      });
    
    return Object.entries(workTypes).map(([type, data]) => ({
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: data.count,
      revenue: data.revenue
    }));
  };

  const getDailyRevenue = () => {
    const daily = {};
    estimations
      .filter(e => e.status === 'confirmed' || e.status === 'completed')
      .forEach(est => {
        const date = new Date(est.createdAt).toLocaleDateString();
        if (!daily[date]) {
          daily[date] = { revenue: 0, count: 0 };
        }
        daily[date].revenue += est.totalCost;
        daily[date].count += 1;
      });
    
    return Object.entries(daily)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 days
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const exportReport = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Headers
    csvContent += 'Date,Car Brand,Car Model,Work Type,Status,Material Cost,Labor Cost,Total Cost,Customer\n';
    
    // Data
    estimations.forEach(est => {
      const row = [
        new Date(est.createdAt).toLocaleDateString(),
        est.carBrand,
        est.carModel,
        est.workType,
        est.status,
        est.materialCost,
        est.laborCost,
        est.totalCost,
        est.customerName || ''
      ].join(',');
      csvContent += row + '\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'estimations_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRevenue = estimations
    .filter(e => e.status === 'confirmed' || e.status === 'completed')
    .reduce((sum, e) => sum + e.totalCost, 0);
  
  const totalMaterialCost = estimations
    .filter(e => e.status === 'confirmed' || e.status === 'completed')
    .reduce((sum, e) => sum + e.materialCost, 0);
  
  const totalLaborCost = estimations
    .filter(e => e.status === 'confirmed' || e.status === 'completed')
    .reduce((sum, e) => sum + e.laborCost, 0);

  return (
    <div className="page-container">
      <AlertBanner alerts={alerts} onDismiss={() => setAlerts([])} />
      
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="page-subtitle">View detailed reports and statistics</p>
        </div>
        <button className="btn btn-primary" onClick={exportReport}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="filter-bar">
        <div className="date-filters">
          <div className="form-group">
            <label><Calendar size={16} /> From</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>To</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <button className="btn btn-secondary" onClick={handleDateFilter}>
            <Filter size={16} /> Apply Filter
          </button>
        </div>
        
        <div className="filter-group">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="summary">Summary Report</option>
            <option value="revenue">Revenue Analysis</option>
            <option value="materials">Material Usage</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-card-content">
            <div className="stat-card-info">
              <h3 className="stat-card-title">Total Estimations</h3>
              <p className="stat-card-value">{formatNumber(estimations.length)}</p>
            </div>
            <ClipboardList size={32} />
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-card-content">
            <div className="stat-card-info">
              <h3 className="stat-card-title">Total Revenue</h3>
              <p className="stat-card-value">{formatCurrency(totalRevenue)}</p>
            </div>
            <DollarSign size={32} />
          </div>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="stat-card-content">
            <div className="stat-card-info">
              <h3 className="stat-card-title">Material Costs</h3>
              <p className="stat-card-value">{formatCurrency(totalMaterialCost)}</p>
            </div>
            <Package size={32} />
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-card-content">
            <div className="stat-card-info">
              <h3 className="stat-card-title">Labor Revenue</h3>
              <p className="stat-card-value">{formatCurrency(totalLaborCost)}</p>
            </div>
            <TrendingUp size={32} />
          </div>
        </div>
      </div>

      {reportType === 'summary' && (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Revenue by Work Type</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getRevenueByWorkType()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                    <Bar dataKey="count" fill="#10b981" name="Jobs" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h2>Work Type Distribution</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getRevenueByWorkType()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {getRevenueByWorkType().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2>Daily Revenue Trend</h2>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getDailyRevenue()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" strokeWidth={2} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" name="Jobs" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {reportType === 'revenue' && (
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Revenue Breakdown</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Work Type</th>
                  <th>Number of Jobs</th>
                  <th>Total Revenue</th>
                  <th>Average per Job</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {getRevenueByWorkType().map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.count}</td>
                    <td className="currency">{formatCurrency(item.revenue)}</td>
                    <td className="currency">{formatCurrency(item.revenue / item.count)}</td>
                    <td>{((item.revenue / totalRevenue) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'materials' && stats?.stock?.lowStockMaterials && (
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Low Stock Materials</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Current Stock</th>
                  <th>Minimum Level</th>
                  <th>Status</th>
                  <th>Action Needed</th>
                </tr>
              </thead>
              <tbody>
                {stats.stock.lowStockMaterials.map((mat) => (
                  <tr key={mat.id}>
                    <td>{mat.name}</td>
                    <td>{mat.currentStock} {mat.unit}</td>
                    <td>{mat.minLevel} {mat.unit}</td>
                    <td>
                      <span className="status-badge status-warning">Low</span>
                    </td>
                    <td>
                      {mat.currentStock === 0 ? (
                        <span className="status-badge status-danger">Out of Stock</span>
                      ) : (
                        <span>Restock needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="dashboard-card">
        <div className="card-header">
          <h2><FileText size={20} /> Detailed Estimations List</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Car</th>
                <th>Work Type</th>
                <th>Customer</th>
                <th>Material Cost</th>
                <th>Labor Cost</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="loading-cell">Loading...</td>
                </tr>
              ) : estimations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-cell">
                    <div className="empty-state">
                      <p>No estimations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                estimations.map((est) => (
                  <tr key={est._id}>
                    <td>{new Date(est.createdAt).toLocaleDateString()}</td>
                    <td>{est.carBrand} {est.carModel}</td>
                    <td>{est.workType.replace('_', ' ')}</td>
                    <td>{est.customerName || '-'}</td>
                    <td className="currency">{formatCurrency(est.materialCost)}</td>
                    <td className="currency">{formatCurrency(est.laborCost)}</td>
                    <td className="currency">{formatCurrency(est.totalCost)}</td>
                    <td>
                      <span className={`status-badge status-${est.status === 'draft' ? 'gray' : est.status === 'confirmed' ? 'blue' : est.status === 'completed' ? 'green' : 'red'}`}>
                        {est.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
