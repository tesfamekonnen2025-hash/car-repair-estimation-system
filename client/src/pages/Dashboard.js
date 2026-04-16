import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  DollarSign,
  ClipboardList,
  Package,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Car
} from 'lucide-react';
import StatCard from '../components/StatCard';
import AlertBanner from '../components/AlertBanner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats', { timeout: 10000 });
      setStats(response.data);
      
      // Set low stock alerts
      if (response.data.stock.lowStockCount > 0) {
        const alertMessage = `${response.data.stock.lowStockCount} material${response.data.stock.lowStockCount > 1 ? 's are' : ' is'} running low on stock!`;
        setAlerts([{ type: 'warning', message: alertMessage }]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setAlerts([{ type: 'error', message: 'Failed to load dashboard data. Please check your connection or try again later.' }]);
    } finally {
      setLoading(false);
    }
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

  const getMonthlyTrendData = () => {
    if (!stats?.monthlyTrend) return [];
    return stats.monthlyTrend.map(item => ({
      month: `${item._id.month}/${item._id.year}`,
      revenue: item.revenue,
      jobs: item.count
    }));
  };

  const getWorkTypeData = () => {
    if (!stats?.workTypeDistribution) return [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b'];
    return stats.workTypeDistribution.map((item, index) => ({
      name: item._id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: item.count,
      color: colors[index % colors.length]
    }));
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <AlertBanner alerts={alerts} onDismiss={() => setAlerts([])} />
      
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Overview of your car repair estimation system</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Jobs"
          value={formatNumber(stats?.estimations?.total)}
          subtitle={`${formatNumber(stats?.estimations?.thisMonth)} this month`}
          icon={ClipboardList}
          color="blue"
          onClick={() => navigate('/estimations')}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue?.total)}
          subtitle={`${formatCurrency(stats?.revenue?.thisMonth)} this month`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Low Stock Items"
          value={formatNumber(stats?.stock?.lowStockCount)}
          subtitle={`of ${formatNumber(stats?.stock?.totalMaterials)} total materials`}
          icon={AlertTriangle}
          color={stats?.stock?.lowStockCount > 0 ? 'red' : 'green'}
          onClick={() => navigate('/materials')}
        />
        <StatCard
          title="Today's Activity"
          value={formatNumber(stats?.estimations?.today)}
          subtitle={`${formatCurrency(stats?.revenue?.today)} revenue`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Monthly Revenue Trend</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getMonthlyTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Work Type Distribution</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getWorkTypeData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getWorkTypeData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {getWorkTypeData().map((entry, index) => (
                <div key={index} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: entry.color }}></span>
                  <span className="legend-label">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Estimations</h2>
            <button className="btn-link" onClick={() => navigate('/estimations')}>
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Car</th>
                  <th>Work Type</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentActivity?.slice(0, 5).map((estimation) => (
                  <tr key={estimation._id}>
                    <td>
                      {estimation.carId ? (
                        <div className="car-info">
                          <Car size={16} />
                          <span>{estimation.carId.brand} {estimation.carId.model}</span>
                        </div>
                      ) : (
                        'Unknown'
                      )}
                    </td>
                    <td>{estimation.workType.replace('_', ' ')}</td>
                    <td className="currency">{formatCurrency(estimation.totalCost)}</td>
                    <td>
                      <span className={`status-badge status-${estimation.status}`}>
                        {estimation.status}
                      </span>
                    </td>
                    <td>{new Date(estimation.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Low Stock Alerts</h2>
            <button className="btn-link" onClick={() => navigate('/materials')}>
              Manage Stock <ChevronRight size={16} />
            </button>
          </div>
          <div className="table-container">
            {stats?.stock?.lowStockMaterials?.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Current</th>
                    <th>Min Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.stock.lowStockMaterials.slice(0, 5).map((material) => (
                    <tr key={material.id}>
                      <td>{material.name}</td>
                      <td>{material.quantity} {material.unit}</td>
                      <td>{material.minLevel} {material.unit}</td>
                      <td>
                        <span className="status-badge status-low">Low</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <Package size={48} className="empty-icon" />
                <p>All materials are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
