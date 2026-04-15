const express = require('express');
const router = express.Router();
const Estimation = require('../models/Estimation');
const Material = require('../models/Material');
const Car = require('../models/Car');

// GET all estimations
router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 50 } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const estimations = await Estimation.find(query)
      .populate('carId', 'brand model numberOfSeats')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(estimations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single estimation
router.get('/:id', async (req, res) => {
  try {
    const estimation = await Estimation.findById(req.params.id)
      .populate('carId')
      .populate('materialsUsed.materialId');
    
    if (!estimation) {
      return res.status(404).json({ message: 'Estimation not found' });
    }
    
    res.json(estimation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST calculate estimation (preview without saving)
router.post('/calculate', async (req, res) => {
  try {
    const {
      carId,
      workType,
      workDetails,
      numberOfSeats, // Use the seats from the form
      laborCostPerSeat = 150
    } = req.body;
    
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Use the seats from request if provided, otherwise fallback to car default
    const actualSeats = numberOfSeats || car.numberOfSeats;
    const fabricMetersPerSeat = typeof car.fabricMetersPerSeat === 'number' ? car.fabricMetersPerSeat : 3;
    const spongeSheetsPerSeat = typeof car.spongeSheetsPerSeat === 'number' ? car.spongeSheetsPerSeat : 0.5;
    const glueLitersPerSeat = typeof car.glueLitersPerSeat === 'number' ? car.glueLitersPerSeat : 0.5;
    
    // Calculate materials needed and costs
    const materialsUsed = [];
    let materialCost = 0;
    let laborCost = 0;
    
    // Seat Repair Calculations
    if (workType === 'seat_repair' || workType === 'both') {
      const seatRepair = workDetails.seatRepair || {};
      const seatsToRepair = seatRepair.seatsToRepair || actualSeats;
      
      // Sponge calculation: ~0.5 sheets per seat
      if (seatRepair.needsSponge) {
        const spongeQty = seatRepair.spongeQuantity || (seatsToRepair * spongeSheetsPerSeat);
        const sponge = seatRepair.spongeMaterialId
          ? await Material.findById(seatRepair.spongeMaterialId)
          : (car.defaultSpongeMaterialId
            ? await Material.findById(car.defaultSpongeMaterialId)
            : await Material.findOne({ name: /Sponge/i }));
        if (sponge) {
          materialsUsed.push({
            materialId: sponge._id,
            name: sponge.name,
            quantity: Math.ceil(spongeQty),
            unit: sponge.unit,
            unitPrice: sponge.price,
            totalPrice: sponge.price * Math.ceil(spongeQty)
          });
        }
      }
      
      // Cloth/Fabric calculation: ~3 meters per seat
      if (seatRepair.needsCloth) {
        const clothQty = seatRepair.clothQuantity || (seatsToRepair * fabricMetersPerSeat);
        const cloth = seatRepair.fabricMaterialId
          ? await Material.findById(seatRepair.fabricMaterialId)
          : (car.defaultFabricMaterialId
            ? await Material.findById(car.defaultFabricMaterialId)
            : await Material.findOne({ name: /Fabric/i }));
        if (cloth) {
          materialsUsed.push({
            materialId: cloth._id,
            name: cloth.name,
            quantity: Math.ceil(clothQty),
            unit: cloth.unit,
            unitPrice: cloth.price,
            totalPrice: cloth.price * Math.ceil(clothQty)
          });
        }
      }
      
      // Sewing accessories: ~1 set per 2 seats
      if (seatRepair.needsSewing) {
        const sewingQty = seatRepair.sewingQuantity || Math.ceil(seatsToRepair / 2);
        const thread = await Material.findOne({ name: /Thread.*Heavy/i });
        const needles = await Material.findOne({ name: /Sewing Needles/i });
        if (thread) {
          materialsUsed.push({
            materialId: thread._id,
            name: thread.name,
            quantity: sewingQty,
            unit: thread.unit,
            unitPrice: thread.price,
            totalPrice: thread.price * sewingQty
          });
        }
        if (needles) {
          materialsUsed.push({
            materialId: needles._id,
            name: needles.name,
            quantity: Math.ceil(sewingQty / 2),
            unit: needles.unit,
            unitPrice: needles.price,
            totalPrice: needles.price * Math.ceil(sewingQty / 2)
          });
        }
      }
      
      // Glue calculation: ~0.5 liter per seat
      if (seatRepair.needsGlue) {
        const glueQty = seatRepair.glueQuantity || (seatsToRepair * glueLitersPerSeat);
        const glue = seatRepair.glueMaterialId
          ? await Material.findById(seatRepair.glueMaterialId)
          : (car.defaultGlueMaterialId
            ? await Material.findById(car.defaultGlueMaterialId)
            : await Material.findOne({ name: /Adhesive|Glue/i }));
        if (glue) {
          materialsUsed.push({
            materialId: glue._id,
            name: glue.name,
            quantity: Math.ceil(glueQty * 2) / 2, // Round to 0.5
            unit: glue.unit,
            unitPrice: glue.price,
            totalPrice: glue.price * Math.ceil(glueQty * 2) / 2
          });
        }
      }
      
      // Second-hand seat replacement
      if (seatRepair.secondHandReplacement) {
        const isFrontSeat = seatsToRepair <= 2;
        const seatType = isFrontSeat ? 'Second-Hand Seat (Front)' : 'Second-Hand Seat (Rear)';
        const secondHandSeat = await Material.findOne({ name: seatType });
        if (secondHandSeat) {
          materialsUsed.push({
            materialId: secondHandSeat._id,
            name: secondHandSeat.name,
            quantity: Math.ceil(seatsToRepair / (isFrontSeat ? 1 : 3)),
            unit: secondHandSeat.unit,
            unitPrice: secondHandSeat.price,
            totalPrice: secondHandSeat.price * Math.ceil(seatsToRepair / (isFrontSeat ? 1 : 3))
          });
        }
      }
      
      // Labor cost for seat repair
      laborCost += seatsToRepair * laborCostPerSeat;
    }
    
    // Interior Decoration Calculations
    if (workType === 'interior_decoration' || workType === 'both') {
      const interior = workDetails.interiorDecoration || {};
      
      // Roof lining: ~3 meters for standard car
      if (interior.roof) {
        const roofQty = interior.clothSheetsQuantity || 3;
        const roofMaterial = await Material.findOne({ name: /Plastic Sheet.*Roof/i });
        if (roofMaterial) {
          materialsUsed.push({
            materialId: roofMaterial._id,
            name: roofMaterial.name,
            quantity: Math.ceil(roofQty),
            unit: roofMaterial.unit,
            unitPrice: roofMaterial.price,
            totalPrice: roofMaterial.price * Math.ceil(roofQty)
          });
        }
      }
      
      // Dashboard: ~1 sheet
      if (interior.dashboard) {
        const dashQty = interior.clothSheetsQuantity || 1;
        const dashMaterial = await Material.findOne({ name: /Plastic Sheet.*Dashboard/i });
        if (dashMaterial) {
          materialsUsed.push({
            materialId: dashMaterial._id,
            name: dashMaterial.name,
            quantity: Math.ceil(dashQty),
            unit: dashMaterial.unit,
            unitPrice: dashMaterial.price,
            totalPrice: dashMaterial.price * Math.ceil(dashQty)
          });
        }
      }
      
      // Floor carpet: ~4-6 meters based on car size
      if (interior.floor) {
        const floorQty = interior.plasticSheetsQuantity || (actualSeats <= 5 ? 4 : 6);
        const carpet = await Material.findOne({ name: /Carpet.*Floor/i });
        const underlay = await Material.findOne({ name: /Underlay/i });
        if (carpet) {
          materialsUsed.push({
            materialId: carpet._id,
            name: carpet.name,
            quantity: Math.ceil(floorQty),
            unit: carpet.unit,
            unitPrice: carpet.price,
            totalPrice: carpet.price * Math.ceil(floorQty)
          });
        }
        if (underlay) {
          materialsUsed.push({
            materialId: underlay._id,
            name: underlay.name,
            quantity: Math.ceil(floorQty),
            unit: underlay.unit,
            unitPrice: underlay.price,
            totalPrice: underlay.price * Math.ceil(floorQty)
          });
        }
      }
      
      // Interior labor cost (higher than seat repair)
      laborCost += actualSeats * 100; // Base interior labor
      if (interior.roof) laborCost += 200;
      if (interior.dashboard) laborCost += 250;
      if (interior.floor) laborCost += 300;
    }
    
    // Calculate total material cost
    materialCost = materialsUsed.reduce((sum, mat) => sum + mat.totalPrice, 0);
    
    const totalCost = materialCost + laborCost;
    
    res.json({
      carId: car._id,
      carBrand: car.brand,
      carModel: car.model,
      vehicleType: car.vehicleType,
      numberOfSeats: actualSeats,
      perSeat: {
        fabricMeters: fabricMetersPerSeat,
        spongeSheets: spongeSheetsPerSeat,
        glueLiters: glueLitersPerSeat,
        labor: laborCostPerSeat
      },
      workType,
      workDetails,
      materialsUsed,
      materialCost,
      laborCost,
      totalCost
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create and save estimation
router.post('/', async (req, res) => {
  try {
    const estimationData = req.body;
    const estimation = new Estimation(estimationData);
    await estimation.save();
    res.status(201).json(estimation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT confirm estimation and deduct stock
router.put('/:id/confirm', async (req, res) => {
  try {
    const estimation = await Estimation.findById(req.params.id);
    
    if (!estimation) {
      return res.status(404).json({ message: 'Estimation not found' });
    }
    
    if (estimation.status !== 'draft') {
      return res.status(400).json({ message: 'Estimation already processed' });
    }
    
    // Check and deduct stock
    for (const mat of estimation.materialsUsed) {
      const material = await Material.findById(mat.materialId);
      if (!material) {
        return res.status(400).json({ message: `Material ${mat.name} not found` });
      }
      if (material.stockQuantity < mat.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${mat.name}. Available: ${material.stockQuantity}, Required: ${mat.quantity}` 
        });
      }
    }
    
    // Deduct stock
    for (const mat of estimation.materialsUsed) {
      await Material.findByIdAndUpdate(
        mat.materialId,
        { $inc: { stockQuantity: -mat.quantity }, updatedAt: Date.now() }
      );
    }
    
    // Update estimation status
    estimation.status = 'confirmed';
    estimation.confirmedAt = new Date();
    await estimation.save();
    
    res.json(estimation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT mark as completed
router.put('/:id/complete', async (req, res) => {
  try {
    const estimation = await Estimation.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );
    
    if (!estimation) {
      return res.status(404).json({ message: 'Estimation not found' });
    }
    
    res.json(estimation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT cancel estimation (restore stock if confirmed)
router.put('/:id/cancel', async (req, res) => {
  try {
    const estimation = await Estimation.findById(req.params.id);
    
    if (!estimation) {
      return res.status(404).json({ message: 'Estimation not found' });
    }
    
    // Restore stock if it was confirmed
    if (estimation.status === 'confirmed') {
      for (const mat of estimation.materialsUsed) {
        await Material.findByIdAndUpdate(
          mat.materialId,
          { $inc: { stockQuantity: mat.quantity }, updatedAt: Date.now() }
        );
      }
    }
    
    estimation.status = 'cancelled';
    await estimation.save();
    
    res.json(estimation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE estimation
router.delete('/:id', async (req, res) => {
  try {
    const estimation = await Estimation.findById(req.params.id);
    
    if (!estimation) {
      return res.status(404).json({ message: 'Estimation not found' });
    }
    
    // Restore stock if confirmed
    if (estimation.status === 'confirmed') {
      for (const mat of estimation.materialsUsed) {
        await Material.findByIdAndUpdate(
          mat.materialId,
          { $inc: { stockQuantity: mat.quantity }, updatedAt: Date.now() }
        );
      }
    }
    
    await Estimation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Estimation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
