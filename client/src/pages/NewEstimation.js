import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Car,
  Wrench,
  Package,
  DollarSign,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  Save
} from 'lucide-react';
import AlertBanner from '../components/AlertBanner';
import ConfirmModal from '../components/ConfirmModal';

const NewEstimation = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState({
    carId: '',
    carBrand: '',
    carModel: '',
    numberOfSeats: 5,
    workType: 'seat_repair',
    workDetails: {
      seatRepair: {
        seatsToRepair: 5,
        needsSponge: true,
        spongeMaterialId: '',
        spongeQuantity: 0,
        needsCloth: true,
        fabricMaterialId: '',
        clothQuantity: 0,
        needsSewing: true,
        sewingQuantity: 0,
        needsGlue: true,
        glueMaterialId: '',
        glueQuantity: 0,
        secondHandReplacement: false
      },
      interiorDecoration: {
        roof: false,
        dashboard: false,
        floor: false,
        clothSheetsQuantity: 0,
        plasticSheetsQuantity: 0,
        glueQuantity: 0,
        sewingAccessoriesQuantity: 0
      }
    },
    laborCostPerSeat: 150,
    customerName: '',
    customerPhone: '',
    notes: ''
  });

  const [preview, setPreview] = useState(null);

  const handleNext = () => {
    if (step === 1 && !formData.carId) {
      setAlerts([{ type: 'error', message: 'Please select a car model before continuing' }]);
      return;
    }
    setStep((prev) => prev + 1);
  };

  useEffect(() => {
    fetchBrands();
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (formData.carBrand) {
      fetchModels(formData.carBrand);
    }
  }, [formData.carBrand]);

  const fetchBrands = async () => {
    try {
      const response = await axios.get('/api/cars/brands');
      setBrands(response.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchModels = async (brand) => {
    try {
      const response = await axios.get(`/api/cars/brand/${encodeURIComponent(brand)}/models`);
      setModels(response.data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await axios.get('/api/materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleCarSelect = (modelData) => {
    setFormData(prev => ({
      ...prev,
      carId: modelData._id,
      carModel: modelData.model,
      numberOfSeats: modelData.numberOfSeats,
      vehicleType: modelData.vehicleType,
      workDetails: {
        ...prev.workDetails,
        seatRepair: {
          ...prev.workDetails.seatRepair,
          seatsToRepair: modelData.numberOfSeats
        }
      }
    }));
  };

  const calculateEstimation = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/estimations/calculate', {
        carId: formData.carId,
        workType: formData.workType,
        workDetails: formData.workDetails,
        numberOfSeats: formData.numberOfSeats, // Now sending the edited seat count
        laborCostPerSeat: formData.laborCostPerSeat
      });
      setPreview(response.data);
    } catch (error) {
      setAlerts([{ type: 'error', message: error.response?.data?.message || 'Error calculating estimation' }]);
    } finally {
      setLoading(false);
    }
  };

  const saveEstimation = async () => {
    setLoading(true);
    try {
      const estimationData = {
        ...preview,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        notes: formData.notes
      };
      
      const response = await axios.post('/api/estimations', estimationData);
      
      if (response.data._id) {
        setShowConfirmModal(true);
      }
    } catch (error) {
      setAlerts([{ type: 'error', message: error.response?.data?.message || 'Error saving estimation' }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmAndDeductStock = async () => {
    try {
      await axios.put(`/api/estimations/${preview._id}/confirm`);
      navigate('/estimations');
    } catch (error) {
      setAlerts([{ type: 'error', message: error.response?.data?.message || 'Error confirming estimation' }]);
      setShowConfirmModal(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const renderStep1 = () => (
    <div className="form-section">
      <h2><Car size={24} /> Select Car</h2>
      
      <div className="form-group">
        <label>Brand</label>
        <select
          value={formData.carBrand}
          onChange={(e) => setFormData(prev => ({ ...prev, carBrand: e.target.value, carId: '', carModel: '' }))}
        >
          <option value="">Select Brand</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>

      {formData.carBrand && (
        <div className="form-group">
          <label>Model</label>
          <div className="model-grid">
            {models.map(model => (
              <button
                key={model._id}
                type="button"
                className={`model-card ${formData.carId === model._id ? 'selected' : ''}`}
                onClick={() => handleCarSelect(model)}
              >
                <span className="model-name">{model.model}</span>
                <span className="model-seats">{model.numberOfSeats} seats</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {formData.carId && (
        <div className="selected-car-info">
          <p><strong>Selected:</strong> {formData.carBrand} {formData.carModel}</p>
          <div className="form-row mt-3">
            <div className="form-group">
              <label>Vehicle Type</label>
              <input type="text" value={formData.vehicleType || 'Automobile'} disabled />
            </div>
            <div className="form-group">
              <label>Number of Seats (Base)</label>
              <input 
                type="number" 
                value={formData.numberOfSeats} 
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfSeats: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="form-section">
      <h2><Wrench size={24} /> Work Type</h2>
      
      <div className="work-type-grid">
        <button
          type="button"
          className={`work-type-card ${formData.workType === 'seat_repair' ? 'selected' : ''}`}
          onClick={() => setFormData(prev => ({ ...prev, workType: 'seat_repair' }))}
        >
          <h3>Seat Repair</h3>
          <p>Repair and reupholster car seats</p>
        </button>
        
        <button
          type="button"
          className={`work-type-card ${formData.workType === 'interior_decoration' ? 'selected' : ''}`}
          onClick={() => setFormData(prev => ({ ...prev, workType: 'interior_decoration' }))}
        >
          <h3>Interior Decoration</h3>
          <p>Dashboard, roof, and floor work</p>
        </button>
        
        <button
          type="button"
          className={`work-type-card ${formData.workType === 'both' ? 'selected' : ''}`}
          onClick={() => setFormData(prev => ({ ...prev, workType: 'both' }))}
        >
          <h3>Both Services</h3>
          <p>Complete interior restoration</p>
        </button>
      </div>

      {(formData.workType === 'seat_repair' || formData.workType === 'both') && (
        <div className="work-details-section">
          <h3>Seat Repair Details</h3>

          {(() => {
            const fabricOptions = materials
              .filter(m => (m.unit === 'meter') && /fabric/i.test(m.name))
              .sort((a, b) => a.name.localeCompare(b.name));

            const spongeOptions = materials
              .filter(m => (m.unit === 'sheet') && /sponge/i.test(m.name))
              .sort((a, b) => a.name.localeCompare(b.name));

            const glueOptions = materials
              .filter(m => /adhesive|glue/i.test(m.name))
              .sort((a, b) => a.name.localeCompare(b.name));

            return (
              <>
                {formData.workDetails.seatRepair.needsCloth && (
                  <div className="form-group">
                    <label>Fabric Type (from Stock)</label>
                    <select
                      value={formData.workDetails.seatRepair.fabricMaterialId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workDetails: {
                          ...prev.workDetails,
                          seatRepair: { ...prev.workDetails.seatRepair, fabricMaterialId: e.target.value }
                        }
                      }))}
                    >
                      <option value="">Auto-select (first Fabric)</option>
                      {fabricOptions.map(m => (
                        <option key={m._id} value={m._id}>{m.name} (Price: {m.price}/{m.unit}, Stock: {m.stockQuantity})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.workDetails.seatRepair.needsSponge && (
                  <div className="form-group">
                    <label>Sponge Type (from Stock)</label>
                    <select
                      value={formData.workDetails.seatRepair.spongeMaterialId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workDetails: {
                          ...prev.workDetails,
                          seatRepair: { ...prev.workDetails.seatRepair, spongeMaterialId: e.target.value }
                        }
                      }))}
                    >
                      <option value="">Auto-select (first Sponge)</option>
                      {spongeOptions.map(m => (
                        <option key={m._id} value={m._id}>{m.name} (Price: {m.price}/{m.unit}, Stock: {m.stockQuantity})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.workDetails.seatRepair.needsGlue && (
                  <div className="form-group">
                    <label>Adhesive / Glue Type (from Stock)</label>
                    <select
                      value={formData.workDetails.seatRepair.glueMaterialId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workDetails: {
                          ...prev.workDetails,
                          seatRepair: { ...prev.workDetails.seatRepair, glueMaterialId: e.target.value }
                        }
                      }))}
                    >
                      <option value="">Auto-select (first Adhesive/Glue)</option>
                      {glueOptions.map(m => (
                        <option key={m._id} value={m._id}>{m.name} (Price: {m.price}/{m.unit}, Stock: {m.stockQuantity})</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            );
          })()}
          
          <div className="form-row">
            <div className="form-group">
              <label>Seats to Repair</label>
              <input
                type="number"
                min="1"
                max={formData.numberOfSeats}
                value={formData.workDetails.seatRepair.seatsToRepair}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workDetails: {
                    ...prev.workDetails,
                    seatRepair: { ...prev.workDetails.seatRepair, seatsToRepair: parseInt(e.target.value) }
                  }
                }))}
              />
            </div>
            
            <div className="form-group">
              <label>Labor Cost Per Seat ($)</label>
              <input
                type="number"
                min="0"
                value={formData.laborCostPerSeat}
                onChange={(e) => setFormData(prev => ({ ...prev, laborCostPerSeat: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.workDetails.seatRepair.needsSponge}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workDetails: {
                    ...prev.workDetails,
                    seatRepair: { ...prev.workDetails.seatRepair, needsSponge: e.target.checked }
                  }
                }))}
              />
              Replace Sponge
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.workDetails.seatRepair.needsCloth}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workDetails: {
                    ...prev.workDetails,
                    seatRepair: { ...prev.workDetails.seatRepair, needsCloth: e.target.checked }
                  }
                }))}
              />
              Replace Cloth/Fabric
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.workDetails.seatRepair.needsSewing}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workDetails: {
                    ...prev.workDetails,
                    seatRepair: { ...prev.workDetails.seatRepair, needsSewing: e.target.checked }
                  }
                }))}
              />
              Sewing Accessories
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.workDetails.seatRepair.needsGlue}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workDetails: {
                    ...prev.workDetails,
                    seatRepair: { ...prev.workDetails.seatRepair, needsGlue: e.target.checked }
                  }
                }))}
              />
              Adhesive/Glue
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.workDetails.seatRepair.secondHandReplacement}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workDetails: {
                    ...prev.workDetails,
                    seatRepair: { ...prev.workDetails.seatRepair, secondHandReplacement: e.target.checked }
                  }
                }))}
              />
              Second-Hand Seat Replacement
            </label>
          </div>
        </div>
      )}

      {(formData.workType === 'interior_decoration' || formData.workType === 'both') && (
        <div className="work-details-section">
          <h3>Interior Decoration Details</h3>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.workDetails.interiorDecoration.roof}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workDetails: {
                    ...prev.workDetails,
                    interiorDecoration: { ...prev.workDetails.interiorDecoration, roof: e.target.checked }
                  }
                }))}
              />
              Roof Lining
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.workDetails.interiorDecoration.dashboard}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workDetails: {
                    ...prev.workDetails,
                    interiorDecoration: { ...prev.workDetails.interiorDecoration, dashboard: e.target.checked }
                  }
                }))}
              />
              Dashboard
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.workDetails.interiorDecoration.floor}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workDetails: {
                    ...prev.workDetails,
                    interiorDecoration: { ...prev.workDetails.interiorDecoration, floor: e.target.checked }
                  }
                }))}
              />
              Floor Carpet
            </label>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="form-section">
      <h2><Package size={24} /> Customer Information</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label>Customer Name</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            placeholder="Enter customer name"
          />
        </div>
        
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          rows="3"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes or special requirements..."
        />
      </div>

      <button
        type="button"
        className="btn btn-primary btn-large"
        onClick={calculateEstimation}
        disabled={loading}
      >
        {loading ? 'Calculating...' : <><Calculator size={20} /> Calculate Estimation</>}
      </button>
    </div>
  );

  const renderStep4 = () => {
    if (!preview) return null;

    return (
      <div className="form-section">
        <h2><DollarSign size={24} /> Cost Summary</h2>
        
        <div className="summary-card">
          <div className="summary-header">
            <h3>{preview.carBrand} {preview.carModel}</h3>
            <span className="work-type-tag">{preview.workType.replace('_', ' ')}</span>
          </div>
          
          <div className="summary-details">
            <div className="summary-row">
              <span>Material Cost:</span>
              <strong>{formatCurrency(preview.materialCost)}</strong>
            </div>
            <div className="summary-row">
              <span>Labor Cost:</span>
              <strong>{formatCurrency(preview.laborCost)}</strong>
            </div>
            <div className="summary-row total">
              <span>Total Cost:</span>
              <strong>{formatCurrency(preview.totalCost)}</strong>
            </div>
          </div>
        </div>

        <div className="materials-list">
          <h3>Materials Required</h3>
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
              {preview.materialsUsed.map((mat, index) => (
                <tr key={index}>
                  <td>{mat.name}</td>
                  <td>{mat.quantity} {mat.unit}</td>
                  <td className="currency">{formatCurrency(mat.unitPrice)}</td>
                  <td className="currency">{formatCurrency(mat.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStep(3)}
          >
            <ChevronLeft size={20} /> Back
          </button>
          <button
            type="button"
            className="btn btn-success btn-large"
            onClick={saveEstimation}
            disabled={loading}
          >
            {loading ? 'Saving...' : <><Save size={20} /> Save Estimation</>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <AlertBanner alerts={alerts} onDismiss={() => setAlerts([])} />
      
      <div className="page-header">
        <h1>New Estimation</h1>
        <p className="page-subtitle">Create a new cost estimation for car seat repair or interior decoration</p>
      </div>

      <div className="step-indicator">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`step ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
            <div className="step-number">{s}</div>
            <div className="step-label">
              {s === 1 && 'Car'}
              {s === 2 && 'Work Type'}
              {s === 3 && 'Details'}
              {s === 4 && 'Summary'}
            </div>
          </div>
        ))}
      </div>

      <div className="estimation-form">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {step < 4 && (
          <div className="form-actions">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft size={20} /> Back
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={step === 1 && !formData.carId}
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Estimation"
        message="Do you want to confirm this estimation and deduct the materials from stock?"
        onConfirm={confirmAndDeductStock}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Confirm & Deduct Stock"
        confirmColor="success"
      />
    </div>
  );
};

export default NewEstimation;
