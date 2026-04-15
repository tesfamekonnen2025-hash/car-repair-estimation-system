import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  Trash2,
  Car,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AlertBanner from '../components/AlertBanner';
import ConfirmModal from '../components/ConfirmModal';

const Estimations = () => {
  const navigate = useNavigate();
  const [estimations, setEstimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEstimation, setSelectedEstimation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [estimationToAction, setEstimationToAction] = useState(null);

  useEffect(() => {
    fetchEstimations();
  }, [filter]);

  const fetchEstimations = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await axios.get('/api/estimations', { params });
      setEstimations(response.data);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error fetching estimations' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await axios.put(`/api/estimations/${id}/confirm`);
      fetchEstimations();
      setAlerts([{ type: 'success', message: 'Estimation confirmed and stock deducted' }]);
    } catch (error) {
      setAlerts([{ type: 'error', message: error.response?.data?.message || 'Error confirming estimation' }]);
    }
  };

  const handleComplete = async (id) => {
    try {
      await axios.put(`/api/estimations/${id}/complete`);
      fetchEstimations();
      setAlerts([{ type: 'success', message: 'Work marked as completed' }]);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error completing estimation' }]);
    }
  };

  const handleCancel = async () => {
    if (!estimationToAction) return;
    try {
      await axios.put(`/api/estimations/${estimationToAction._id}/cancel`);
      fetchEstimations();
      setAlerts([{ type: 'success', message: 'Estimation cancelled' }]);
      setShowCancelModal(false);
      setEstimationToAction(null);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error cancelling estimation' }]);
    }
  };

  const handleDelete = async () => {
    if (!estimationToAction) return;
    try {
      await axios.delete(`/api/estimations/${estimationToAction._id}`);
      fetchEstimations();
      setAlerts([{ type: 'success', message: 'Estimation deleted' }]);
      setShowDeleteModal(false);
      setEstimationToAction(null);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error deleting estimation' }]);
    }
  };

  const viewDetails = async (id) => {
    try {
      const response = await axios.get(`/api/estimations/${id}`);
      setSelectedEstimation(response.data);
      setShowDetailModal(true);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error fetching estimation details' }]);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'gray',
      confirmed: 'blue',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'gray';
  };

  const filteredEstimations = estimations.filter(est => {
    const searchLower = searchQuery.toLowerCase();
    return (
      est.carBrand?.toLowerCase().includes(searchLower) ||
      est.carModel?.toLowerCase().includes(searchLower) ||
      est.customerName?.toLowerCase().includes(searchLower) ||
      est.workType?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="page-container">
      <AlertBanner alerts={alerts} onDismiss={() => setAlerts([])} />
      
      <div className="page-header">
        <div>
          <h1>Estimations</h1>
          <p className="page-subtitle">Manage all your repair estimations</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/estimation/new')}>
          + New Estimation
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by car, customer, or work type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={20} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table estimations-table">
          <thead>
            <tr>
              <th>Car</th>
              <th>Work Type</th>
              <th>Customer</th>
              <th>Total Cost</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="loading-cell">Loading...</td>
              </tr>
            ) : filteredEstimations.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  <div className="empty-state">
                    <p>No estimations found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEstimations.map((estimation) => (
                <tr key={estimation._id}>
                  <td>
                    <div className="car-info">
                      <Car size={18} />
                      <div>
                        <div className="car-name">{estimation.carBrand} {estimation.carModel}</div>
                        <div className="car-seats">{estimation.numberOfSeats} seats</div>
                      </div>
                    </div>
                  </td>
                  <td>{estimation.workType.replace('_', ' ')}</td>
                  <td>{estimation.customerName || '-'}</td>
                  <td className="currency">{formatCurrency(estimation.totalCost)}</td>
                  <td>
                    <span className={`status-badge status-${getStatusColor(estimation.status)}`}>
                      {estimation.status}
                    </span>
                  </td>
                  <td>{formatDate(estimation.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => viewDetails(estimation._id)}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {estimation.status === 'draft' && (
                        <button
                          className="btn-icon btn-success"
                          onClick={() => handleConfirm(estimation._id)}
                          title="Confirm"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      
                      {estimation.status === 'confirmed' && (
                        <button
                          className="btn-icon btn-success"
                          onClick={() => handleComplete(estimation._id)}
                          title="Mark Complete"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      
                      {(estimation.status === 'draft' || estimation.status === 'confirmed') && (
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => {
                            setEstimationToAction(estimation);
                            setShowCancelModal(true);
                          }}
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      )}
                      
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => {
                          setEstimationToAction(estimation);
                          setShowDeleteModal(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedEstimation && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Estimation Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Car Information</h3>
                <p><strong>Brand:</strong> {selectedEstimation.carBrand}</p>
                <p><strong>Model:</strong> {selectedEstimation.carModel}</p>
                <p><strong>Seats:</strong> {selectedEstimation.numberOfSeats}</p>
              </div>
              
              <div className="detail-section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {selectedEstimation.customerName || '-'}</p>
                <p><strong>Phone:</strong> {selectedEstimation.customerPhone || '-'}</p>
              </div>
              
              <div className="detail-section">
                <h3>Materials Used</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEstimation.materialsUsed.map((mat, idx) => (
                      <tr key={idx}>
                        <td>{mat.name}</td>
                        <td>{mat.quantity} {mat.unit}</td>
                        <td className="currency">{formatCurrency(mat.unitPrice)}</td>
                        <td className="currency">{formatCurrency(mat.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="detail-section">
                <h3>Cost Summary</h3>
                <div className="summary-row">
                  <span>Material Cost:</span>
                  <strong>{formatCurrency(selectedEstimation.materialCost)}</strong>
                </div>
                <div className="summary-row">
                  <span>Labor Cost:</span>
                  <strong>{formatCurrency(selectedEstimation.laborCost)}</strong>
                </div>
                <div className="summary-row total">
                  <span>Total Cost:</span>
                  <strong>{formatCurrency(selectedEstimation.totalCost)}</strong>
                </div>
              </div>
              
              {selectedEstimation.notes && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <p>{selectedEstimation.notes}</p>
                </div>
              )}
              
              <div className="detail-section">
                <h3>Status History</h3>
                <p><strong>Status:</strong> <span className={`status-badge status-${getStatusColor(selectedEstimation.status)}`}>{selectedEstimation.status}</span></p>
                <p><strong>Created:</strong> {formatDate(selectedEstimation.createdAt)}</p>
                {selectedEstimation.confirmedAt && (
                  <p><strong>Confirmed:</strong> {formatDate(selectedEstimation.confirmedAt)}</p>
                )}
                {selectedEstimation.completedAt && (
                  <p><strong>Completed:</strong> {formatDate(selectedEstimation.completedAt)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Estimation"
        message={`Are you sure you want to cancel this estimation for ${estimationToAction?.carBrand} ${estimationToAction?.carModel}? ${estimationToAction?.status === 'confirmed' ? 'This will restore the materials to stock.' : ''}`}
        onConfirm={handleCancel}
        onCancel={() => {
          setShowCancelModal(false);
          setEstimationToAction(null);
        }}
        confirmText="Cancel Estimation"
        confirmColor="danger"
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Estimation"
        message={`Are you sure you want to permanently delete this estimation for ${estimationToAction?.carBrand} ${estimationToAction?.carModel}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setEstimationToAction(null);
        }}
        confirmText="Delete"
        confirmColor="danger"
      />
    </div>
  );
};

export default Estimations;
