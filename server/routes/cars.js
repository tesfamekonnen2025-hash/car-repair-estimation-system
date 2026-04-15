const express = require('express');
const router = express.Router();
const Car = require('../models/Car');

// GET all cars with optional filtering
router.get('/', async (req, res) => {
  try {
    const { brand, search } = req.query;
    let query = {};
    
    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }
    
    if (search) {
      query.$or = [
        { brand: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') }
      ];
    }
    
    const cars = await Car.find(query).sort({ brand: 1, model: 1 });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET unique brands
router.get('/brands', async (req, res) => {
  try {
    const brands = await Car.distinct('brand');
    res.json(brands.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET models by brand
router.get('/brand/:brand/models', async (req, res) => {
  try {
    const models = await Car.find({ 
      brand: new RegExp(req.params.brand, 'i') 
    }).select('model numberOfSeats vehicleType fabricMetersPerSeat spongeSheetsPerSeat glueLitersPerSeat defaultFabricMaterialId defaultSpongeMaterialId defaultGlueMaterialId');
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single car by ID
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new car
router.post('/', async (req, res) => {
  try {
    const { brand, model, numberOfSeats, vehicleType, fabricMetersPerSeat, spongeSheetsPerSeat, glueLitersPerSeat, defaultFabricMaterialId, defaultSpongeMaterialId, defaultGlueMaterialId } = req.body;
    
    // Check if car already exists
    const existingCar = await Car.findOne({ 
      brand: new RegExp(`^${brand}$`, 'i'), 
      model: new RegExp(`^${model}$`, 'i') 
    });
    
    if (existingCar) {
      return res.status(400).json({ message: 'Car with this brand and model already exists' });
    }
    
    const car = new Car({
      brand,
      model,
      numberOfSeats,
      vehicleType,
      fabricMetersPerSeat,
      spongeSheetsPerSeat,
      glueLitersPerSeat,
      defaultFabricMaterialId,
      defaultSpongeMaterialId,
      defaultGlueMaterialId
    });
    
    await car.save();
    res.status(201).json(car);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update car
router.put('/:id', async (req, res) => {
  try {
    const { brand, model, numberOfSeats, vehicleType, fabricMetersPerSeat, spongeSheetsPerSeat, glueLitersPerSeat, defaultFabricMaterialId, defaultSpongeMaterialId, defaultGlueMaterialId } = req.body;
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { brand, model, numberOfSeats, vehicleType, fabricMetersPerSeat, spongeSheetsPerSeat, glueLitersPerSeat, defaultFabricMaterialId, defaultSpongeMaterialId, defaultGlueMaterialId },
      { new: true, runValidators: true }
    );
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    res.json(car);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE car
router.delete('/:id', async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed sample car data with common Ethiopian brands and types
router.post('/seed', async (req, res) => {
  try {
    const sampleCars = [
      { brand: 'Toyota', model: 'Corolla', vehicleType: 'Automobile', numberOfSeats: 5, fabricMetersPerSeat: 3, spongeSheetsPerSeat: 0.5 },
      { brand: 'Toyota', model: 'Vitz', vehicleType: 'Automobile', numberOfSeats: 5, fabricMetersPerSeat: 2.7, spongeSheetsPerSeat: 0.45 },
      { brand: 'Toyota', model: 'Yaris', vehicleType: 'Automobile', numberOfSeats: 5, fabricMetersPerSeat: 2.8, spongeSheetsPerSeat: 0.45 },
      { brand: 'Toyota', model: 'Hiace', vehicleType: 'Minibus', numberOfSeats: 15, fabricMetersPerSeat: 3.2, spongeSheetsPerSeat: 0.55 },
      { brand: 'Toyota', model: 'Land Cruiser', vehicleType: 'Family/SUV', numberOfSeats: 7, fabricMetersPerSeat: 3.3, spongeSheetsPerSeat: 0.6 },
      { brand: 'Toyota', model: 'Hilux', vehicleType: 'Truck', numberOfSeats: 5, fabricMetersPerSeat: 3, spongeSheetsPerSeat: 0.55 },
      { brand: 'Hyundai', model: 'Atos', vehicleType: 'Automobile', numberOfSeats: 5, fabricMetersPerSeat: 2.6, spongeSheetsPerSeat: 0.45 },
      { brand: 'Hyundai', model: 'Tucson', vehicleType: 'Family/SUV', numberOfSeats: 5, fabricMetersPerSeat: 3.2, spongeSheetsPerSeat: 0.55 },
      { brand: 'Hyundai', model: 'H1', vehicleType: 'Minibus', numberOfSeats: 12, fabricMetersPerSeat: 3.1, spongeSheetsPerSeat: 0.55 },
      { brand: 'Suzuki', model: 'Swift', vehicleType: 'Automobile', numberOfSeats: 5, fabricMetersPerSeat: 2.7, spongeSheetsPerSeat: 0.45 },
      { brand: 'Suzuki', model: 'Dzire', vehicleType: 'Automobile', numberOfSeats: 5, fabricMetersPerSeat: 2.7, spongeSheetsPerSeat: 0.45 },
      { brand: 'Isuzu', model: 'FSR', vehicleType: 'Truck', numberOfSeats: 3, fabricMetersPerSeat: 3.4, spongeSheetsPerSeat: 0.6 },
      { brand: 'Isuzu', model: 'NPR', vehicleType: 'Truck', numberOfSeats: 3, fabricMetersPerSeat: 3.3, spongeSheetsPerSeat: 0.6 },
      { brand: 'Lifan', model: '520', vehicleType: 'Automobile', numberOfSeats: 5, fabricMetersPerSeat: 2.8, spongeSheetsPerSeat: 0.5 },
      { brand: 'Volkswagen', model: 'Beetle', vehicleType: 'Automobile', numberOfSeats: 4, fabricMetersPerSeat: 2.6, spongeSheetsPerSeat: 0.45 },
      { brand: 'Mitsubishi', model: 'Lancer', vehicleType: 'Automobile', numberOfSeats: 5, fabricMetersPerSeat: 3, spongeSheetsPerSeat: 0.5 },
      { brand: 'Mitsubishi', model: 'Pajero', vehicleType: 'Family/SUV', numberOfSeats: 7, fabricMetersPerSeat: 3.3, spongeSheetsPerSeat: 0.6 },
      { brand: 'Sino Truck', model: 'Howo', vehicleType: 'Truck', numberOfSeats: 2, fabricMetersPerSeat: 3.6, spongeSheetsPerSeat: 0.7 },
      { brand: 'Abay', model: 'Bus', vehicleType: 'Bus', numberOfSeats: 45, fabricMetersPerSeat: 3.5, spongeSheetsPerSeat: 0.65 },
      { brand: 'Bishoftu', model: 'City Bus', vehicleType: 'Bus', numberOfSeats: 60, fabricMetersPerSeat: 3.5, spongeSheetsPerSeat: 0.65 }
    ];
    
    await Car.deleteMany({});
    const cars = await Car.insertMany(sampleCars);
    res.json({ message: `Seeded ${cars.length} cars with Ethiopian market defaults`, cars });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
