import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Car,
  RefreshCw
} from 'lucide-react';
import AlertBanner from '../components/AlertBanner';
import ConfirmModal from '../components/ConfirmModal';

const CarManagement = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [brands, setBrands] = useState([]);
  const [materials, setMaterials] = useState({ fabrics: [], sponges: [], glues: [] });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    vehicleType: 'Automobile',
    numberOfSeats: 5,
    fabricMetersPerSeat: 3,
    spongeSheetsPerSeat: 0.5,
    glueLitersPerSeat: 0.5,
    defaultFabricMaterialId: '',
    defaultSpongeMaterialId: '',
    defaultGlueMaterialId: ''
  });

  const vehicleTypes = ['Automobile', 'Minibus', 'Truck', 'Bus', 'Family/SUV', 'Other'];

  useEffect(() => {
    fetchCars();
    fetchBrands();
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get('/api/materials');
      const all = response.data || [];
      const fabrics = all
        .filter(m => m.unit === 'meter' && /fabric/i.test(m.name))
        .sort((a, b) => a.name.localeCompare(b.name));
      const sponges = all
        .filter(m => (/sponge/i.test(m.name) || m.unit === 'sheet') && (m.category === 'seat_repair' || /sponge/i.test(m.name)))
        .sort((a, b) => a.name.localeCompare(b.name));
      const glues = all
        .filter(m => /adhesive|glue/i.test(m.name))
        .sort((a, b) => a.name.localeCompare(b.name));
      setMaterials({ fabrics, sponges, glues });
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error fetching materials for dropdowns' }]);
    }
  };

  const fetchCars = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/cars');
      setCars(response.data);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error fetching cars' }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get('/api/cars/brands');
      setBrands(response.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const seedSampleData = async () => {
    try {
      await axios.post('/api/cars/seed');
      fetchCars();
      fetchBrands();
      setAlerts([{ type: 'success', message: 'Sample data loaded successfully' }]);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error seeding sample data' }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCar) {
        await axios.put(`/api/cars/${editingCar._id}`, formData);
        setAlerts([{ type: 'success', message: 'Car updated successfully' }]);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        await axios.post('/api/cars', formData);
        setAlerts([{ type: 'success', message: 'Car added successfully' }]);
      }
      setShowModal(false);
      setEditingCar(null);
      setFormData({
        brand: '',
        model: '',
        vehicleType: 'Automobile',
        numberOfSeats: 5,
        fabricMetersPerSeat: 3,
        spongeSheetsPerSeat: 0.5,
        glueLitersPerSeat: 0.5,
        defaultFabricMaterialId: '',
        defaultSpongeMaterialId: '',
        defaultGlueMaterialId: ''
      });
      fetchCars();
      fetchBrands();
    } catch (error) {
      setAlerts([{ type: 'error', message: error.response?.data?.message || 'Error saving car' }]);
    }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand,
      model: car.model,
      vehicleType: car.vehicleType || 'Automobile',
      numberOfSeats: car.numberOfSeats,
      fabricMetersPerSeat: typeof car.fabricMetersPerSeat === 'number' ? car.fabricMetersPerSeat : 3,
      spongeSheetsPerSeat: typeof car.spongeSheetsPerSeat === 'number' ? car.spongeSheetsPerSeat : 0.5,
      glueLitersPerSeat: typeof car.glueLitersPerSeat === 'number' ? car.glueLitersPerSeat : 0.5,
      defaultFabricMaterialId: car.defaultFabricMaterialId || '',
      defaultSpongeMaterialId: car.defaultSpongeMaterialId || '',
      defaultGlueMaterialId: car.defaultGlueMaterialId || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!carToDelete) return;
    try {
      await axios.delete(`/api/cars/${carToDelete._id}`);
      setAlerts([{ type: 'success', message: 'Car deleted successfully' }]);
      setShowDeleteModal(false);
      setCarToDelete(null);
      fetchCars();
      fetchBrands();
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Error deleting car' }]);
    }
  };

  const filteredCars = cars.filter(car => {
    const searchLower = searchQuery.toLowerCase();
    return (
      car.brand.toLowerCase().includes(searchLower) ||
      car.model.toLowerCase().includes(searchLower)
    );
  });

  const carsByBrand = filteredCars.reduce((acc, car) => {
    if (!acc[car.brand]) acc[car.brand] = [];
    acc[car.brand].push(car);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <AlertBanner alerts={alerts} onDismiss={() => setAlerts([])} />
      
      <div className="page-header">
        <div>
          <h1>Car Management</h1>
          <p className="page-subtitle">Manage car brands and models for estimation</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={seedSampleData}>
            <RefreshCw size={18} /> Load Sample Data
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add Car
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search cars by brand or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="stats-pill">
          {cars.length} total cars • {brands.length} brands
        </div>
      </div>

      <div className="cars-grid">
        {loading ? (
          <div className="loading-state">Loading cars...</div>
        ) : Object.keys(carsByBrand).length === 0 ? (
          <div className="empty-state">
            <Car size={48} className="empty-icon" />
            <p>No cars found</p>
            <button className="btn btn-secondary" onClick={seedSampleData}>
              Load Sample Data
            </button>
          </div>
        ) : (
          Object.entries(carsByBrand).map(([brand, brandCars]) => (
            <div key={brand} className="brand-card">
              <div className="brand-header">
                <h3>{brand}</h3>
                <span className="brand-count">{brandCars.length} models</span>
              </div>
              <div className="models-list">
                {brandCars.map(car => (
                  <div key={car._id} className="model-item">
                    <div className="model-info">
                      <span className="model-name">{car.model}</span>
                      <span className="model-seats">{car.numberOfSeats} seats</span>
                    </div>
                    <div className="model-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(car)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => {
                          setCarToDelete(car);
                          setShowDeleteModal(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCar ? 'Edit Car' : 'Add New Car'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Toyota"
                    required
                    list="brands-list"
                  />
                  <datalist id="brands-list">
                    {brands.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
                
                <div className="form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., Corolla"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Vehicle Type *</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    required
                  >
                    {vehicleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Number of Seats *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.numberOfSeats}
                    onChange={(e) => setFormData({ ...formData, numberOfSeats: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fabric (meters) per Seat *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.fabricMetersPerSeat}
                      onChange={(e) => setFormData({ ...formData, fabricMetersPerSeat: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Sponge (sheets) per Seat *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.05"
                      value={formData.spongeSheetsPerSeat}
                      onChange={(e) => setFormData({ ...formData, spongeSheetsPerSeat: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Default Fabric Type (from Stock)</label>
                  <select
                    value={formData.defaultFabricMaterialId}
                    onChange={(e) => setFormData({ ...formData, defaultFabricMaterialId: e.target.value })}
                  >
                    <option value="">Auto-select (first Fabric)</option>
                    {materials.fabrics.map(m => (
                      <option key={m._id} value={m._id}>{m.name} (Price: {m.price}/{m.unit}, Stock: {m.stockQuantity})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Default Sponge Type (from Stock)</label>
                  <select
                    value={formData.defaultSpongeMaterialId}
                    onChange={(e) => setFormData({ ...formData, defaultSpongeMaterialId: e.target.value })}
                  >
                    <option value="">Auto-select (first Sponge)</option>
                    {materials.sponges.map(m => (
                      <option key={m._id} value={m._id}>{m.name} (Price: {m.price}/{m.unit}, Stock: {m.stockQuantity})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Default Adhesive/Glue Type (from Stock)</label>
                  <select
                    value={formData.defaultGlueMaterialId}
                    onChange={(e) => setFormData({ ...formData, defaultGlueMaterialId: e.target.value })}
                  >
                    <option value="">Auto-select (first Adhesive/Glue)</option>
                    {materials.glues.map(m => (
                      <option key={m._id} value={m._id}>{m.name} (Price: {m.price}/{m.unit}, Stock: {m.stockQuantity})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Adhesive/Glue (liters) per Seat *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={formData.glueLitersPerSeat}
                    onChange={(e) => setFormData({ ...formData, glueLitersPerSeat: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={18} /> {editingCar ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Car"
        message={`Are you sure you want to delete ${carToDelete?.brand} ${carToDelete?.model}? This may affect existing estimations.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setCarToDelete(null);
        }}
        confirmText="Delete"
        confirmColor="danger"
      />
    </div>
  );
};

export default CarManagement;
