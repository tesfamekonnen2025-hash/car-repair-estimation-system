import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Package,
  AlertTriangle,
  Minus,
  Plus as PlusIcon,
  RefreshCw,
  Filter
} from 'lucide-react';
import AlertBanner from '../components/AlertBanner';
import ConfirmModal from '../components/ConfirmModal';

const MaterialStock = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [stockOperation, setStockOperation] = useState({ operation: 'add', quantity: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'piece',
    price: 0,
    stockQuantity: 0,
    minStockLevel: 10,
    category: 'general',
    description: ''
  });

  const units = ['piece', 'meter', 'kg', 'liter', 'set', 'roll', 'sheet'];
  const categories = [
    { value: 'general', label: 'General' },
    { value: 'seat_repair', label: 'Seat Repair' },
    { value: 'interior_decoration', label: 'Interior Decoration' }
  ];

  useEffect(() => {
    fetchMaterials();
  }, [categoryFilter]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = categoryFilter !== 'all' ? { category: categoryFilter } : {};
      const response = await axios.get('/api/materials', { params });
      setMaterials(response.data);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error fetching materials' }]);
    } finally {
      setLoading(false);
    }
  };

  const seedSampleData = async () => {
    try {
      await axios.post('/api/materials/seed');
      fetchMaterials();
      setAlerts([{ type: 'success', message: 'Sample materials loaded successfully' }]);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error seeding sample data' }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await axios.put(`/api/materials/${editingMaterial._id}`, formData);
        setAlerts([{ type: 'success', message: 'Material updated successfully' }]);
      } else {
        await axios.post('/api/materials', formData);
        setAlerts([{ type: 'success', message: 'Material added successfully' }]);
      }
      setShowModal(false);
      setEditingMaterial(null);
      setFormData({
        name: '',
        unit: 'piece',
        price: 0,
        stockQuantity: 0,
        minStockLevel: 10,
        category: 'general',
        description: ''
      });
      fetchMaterials();
    } catch (error) {
      setAlerts([{ type: 'error', message: error.response?.data?.message || 'Error saving material' }]);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      unit: material.unit,
      price: material.price,
      stockQuantity: material.stockQuantity,
      minStockLevel: material.minStockLevel,
      category: material.category,
      description: material.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!materialToDelete) return;
    try {
      await axios.delete(`/api/materials/${materialToDelete._id}`);
      setAlerts([{ type: 'success', message: 'Material deleted successfully' }]);
      setShowDeleteModal(false);
      setMaterialToDelete(null);
      fetchMaterials();
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error deleting material' }]);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    try {
      await axios.put(`/api/materials/${selectedMaterial._id}/stock`, stockOperation);
      setAlerts([{ type: 'success', message: 'Stock updated successfully' }]);
      setShowStockModal(false);
      setSelectedMaterial(null);
      setStockOperation({ operation: 'add', quantity: 0 });
      fetchMaterials();
    } catch (error) {
      setAlerts([{ type: 'error', message: error.response?.data?.message || 'Error updating stock' }]);
    }
  };

  const openStockModal = (material) => {
    setSelectedMaterial(material);
    setStockOperation({ operation: 'add', quantity: 0 });
    setShowStockModal(true);
  };

  const getStockStatus = (material) => {
    if (material.stockQuantity <= 0) return { label: 'Out of Stock', class: 'status-danger' };
    if (material.stockQuantity <= material.minStockLevel) return { label: 'Low', class: 'status-warning' };
    return { label: 'OK', class: 'status-success' };
  };

  const filteredMaterials = materials.filter(material => {
    const searchLower = searchQuery.toLowerCase();
    return material.name.toLowerCase().includes(searchLower);
  });

  const lowStockCount = materials.filter(m => m.stockQuantity <= m.minStockLevel).length;
  const outOfStockCount = materials.filter(m => m.stockQuantity <= 0).length;

  return (
    <div className="page-container">
      <AlertBanner alerts={alerts} onDismiss={() => setAlerts([])} />
      
      <div className="page-header">
        <div>
          <h1>Materials & Stock</h1>
          <p className="page-subtitle">Manage inventory and material pricing</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={seedSampleData}>
            <RefreshCw size={18} /> Load Sample Data
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add Material
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-pill">
          <Package size={16} />
          <span>{materials.length} Materials</span>
        </div>
        {lowStockCount > 0 && (
          <div className="stat-pill stat-pill-warning">
            <AlertTriangle size={16} />
            <span>{lowStockCount} Low Stock</span>
          </div>
        )}
        {outOfStockCount > 0 && (
          <div className="stat-pill stat-pill-danger">
            <AlertTriangle size={16} />
            <span>{outOfStockCount} Out of Stock</span>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={20} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table materials-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Unit Price</th>
              <th>Stock</th>
              <th>Min Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="loading-cell">Loading...</td>
              </tr>
            ) : filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">
                  <div className="empty-state">
                    <Package size={48} className="empty-icon" />
                    <p>No materials found</p>
                    <button className="btn btn-secondary" onClick={seedSampleData}>
                      Load Sample Data
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMaterials.map((material) => {
                const stockStatus = getStockStatus(material);
                return (
                  <tr key={material._id}>
                    <td>
                      <div className="material-info">
                        <strong>{material.name}</strong>
                        {material.description && (
                          <small className="material-desc">{material.description}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`category-badge category-${material.category}`}>
                        {material.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{material.unit}</td>
                    <td className="currency">
                      ${material.price.toFixed(2)}
                    </td>
                    <td>
                      <div className="stock-display">
                        <span className={material.stockQuantity <= material.minStockLevel ? 'stock-low' : ''}>
                          {material.stockQuantity}
                        </span>
                        <button
                          className="btn-icon btn-small"
                          onClick={() => openStockModal(material)}
                          title="Update Stock"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                    </td>
                    <td>{material.minStockLevel}</td>
                    <td>
                      <span className={`status-badge ${stockStatus.class}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(material)}
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => {
                            setMaterialToDelete(material);
                            setShowDeleteModal(true);
                          }}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMaterial ? 'Edit Material' : 'Add New Material'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., High Density Sponge"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Unit *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      required
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Unit Price ($) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Minimum Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) })}
                  />
                  <small>Alert when stock falls below this level</small>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={18} /> {editingMaterial ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && selectedMaterial && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Stock: {selectedMaterial.name}</h2>
              <button className="modal-close" onClick={() => setShowStockModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStockUpdate}>
              <div className="modal-body">
                <div className="current-stock-display">
                  <p>Current Stock: <strong>{selectedMaterial.stockQuantity} {selectedMaterial.unit}</strong></p>
                </div>
                
                <div className="form-group">
                  <label>Operation</label>
                  <div className="operation-buttons">
                    <button
                      type="button"
                      className={`operation-btn ${stockOperation.operation === 'add' ? 'active' : ''}`}
                      onClick={() => setStockOperation({ ...stockOperation, operation: 'add' })}
                    >
                      <PlusIcon size={18} /> Add Stock
                    </button>
                    <button
                      type="button"
                      className={`operation-btn ${stockOperation.operation === 'subtract' ? 'active' : ''}`}
                      onClick={() => setStockOperation({ ...stockOperation, operation: 'subtract' })}
                    >
                      <Minus size={18} /> Remove Stock
                    </button>
                    <button
                      type="button"
                      className={`operation-btn ${stockOperation.operation === 'set' ? 'active' : ''}`}
                      onClick={() => setStockOperation({ ...stockOperation, operation: 'set' })}
                    >
                      Set Stock
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={stockOperation.quantity}
                    onChange={(e) => setStockOperation({ ...stockOperation, quantity: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={18} /> Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Material"
        message={`Are you sure you want to delete "${materialToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setMaterialToDelete(null);
        }}
        confirmText="Delete"
        confirmColor="danger"
      />
    </div>
  );
};

export default MaterialStock;
