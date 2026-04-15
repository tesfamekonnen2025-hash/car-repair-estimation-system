const express = require('express');
const router = express.Router();
const Material = require('../models/Material');

// GET all materials
router.get('/', async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    const materials = await Material.find(query).sort({ category: 1, name: 1 });
    
    // Add low stock status
    const materialsWithStatus = materials.map(mat => ({
      ...mat.toObject(),
      status: mat.stockQuantity <= mat.minStockLevel ? 'low' : 'ok'
    }));
    
    if (lowStock === 'true') {
      const lowStockMaterials = materialsWithStatus.filter(m => m.status === 'low');
      return res.json(lowStockMaterials);
    }
    
    res.json(materialsWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single material by ID
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new material
router.post('/', async (req, res) => {
  try {
    const { name, unit, price, stockQuantity, minStockLevel, category, description } = req.body;
    
    const material = new Material({
      name,
      unit,
      price,
      stockQuantity,
      minStockLevel,
      category,
      description
    });
    
    await material.save();
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update material
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = Date.now();
    
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    res.json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update stock quantity
router.put('/:id/stock', async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    if (operation === 'add') {
      material.stockQuantity += quantity;
    } else if (operation === 'subtract') {
      if (material.stockQuantity < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      material.stockQuantity -= quantity;
    } else if (operation === 'set') {
      material.stockQuantity = quantity;
    } else {
      return res.status(400).json({ message: 'Invalid operation' });
    }
    
    material.updatedAt = Date.now();
    await material.save();
    
    res.json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE material
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed sample materials
router.post('/seed', async (req, res) => {
  try {
    const sampleMaterials = [
      { name: 'Sponge (High Density)', unit: 'sheet', price: 45, stockQuantity: 100, minStockLevel: 20, category: 'seat_repair', description: 'High density foam sponge for seat cushioning' },
      { name: 'Sponge (Medium Density)', unit: 'sheet', price: 30, stockQuantity: 80, minStockLevel: 15, category: 'seat_repair', description: 'Medium density foam sponge' },
      { name: 'Fabric (Leather Pattern)', unit: 'meter', price: 25, stockQuantity: 150, minStockLevel: 30, category: 'seat_repair', description: 'Synthetic leather fabric' },
      { name: 'Fabric (Velvet)', unit: 'meter', price: 35, stockQuantity: 60, minStockLevel: 15, category: 'seat_repair', description: 'Premium velvet fabric' },
      { name: 'Fabric (Standard)', unit: 'meter', price: 15, stockQuantity: 200, minStockLevel: 40, category: 'seat_repair', description: 'Standard cloth fabric' },
      { name: 'Thread (Heavy Duty)', unit: 'roll', price: 8, stockQuantity: 50, minStockLevel: 10, category: 'seat_repair', description: 'Heavy duty nylon thread' },
      { name: 'Sewing Needles Set', unit: 'set', price: 5, stockQuantity: 40, minStockLevel: 10, category: 'seat_repair', description: 'Assorted sewing needles' },
      { name: 'Adhesive Glue (Contact)', unit: 'liter', price: 25, stockQuantity: 30, minStockLevel: 5, category: 'general', description: 'Contact cement adhesive' },
      { name: 'Adhesive Glue (Spray)', unit: 'can', price: 18, stockQuantity: 25, minStockLevel: 5, category: 'general', description: 'Spray adhesive' },
      { name: 'Plastic Sheet (Roof Lining)', unit: 'sheet', price: 40, stockQuantity: 45, minStockLevel: 10, category: 'interior_decoration', description: 'Headliner fabric with foam backing' },
      { name: 'Plastic Sheet (Dashboard)', unit: 'sheet', price: 55, stockQuantity: 30, minStockLevel: 8, category: 'interior_decoration', description: 'Dashboard covering material' },
      { name: 'Carpet (Floor)', unit: 'meter', price: 30, stockQuantity: 80, minStockLevel: 15, category: 'interior_decoration', description: 'Automotive carpet' },
      { name: 'Underlay Foam', unit: 'meter', price: 12, stockQuantity: 100, minStockLevel: 20, category: 'interior_decoration', description: 'Carpet underlay foam' },
      { name: 'Door Panel Fabric', unit: 'meter', price: 22, stockQuantity: 70, minStockLevel: 15, category: 'interior_decoration', description: 'Door trim fabric' },
      { name: 'Seat Tracks', unit: 'piece', price: 35, stockQuantity: 20, minStockLevel: 5, category: 'seat_repair', description: 'Seat rail mechanism' },
      { name: 'Seat Belts', unit: 'piece', price: 45, stockQuantity: 15, minStockLevel: 3, category: 'seat_repair', description: 'Safety seat belts' },
      { name: 'Seat Springs', unit: 'set', price: 25, stockQuantity: 25, minStockLevel: 5, category: 'seat_repair', description: 'Seat spring replacement set' },
      { name: 'Second-Hand Seat (Front)', unit: 'piece', price: 120, stockQuantity: 10, minStockLevel: 2, category: 'seat_repair', description: 'Refurbished front seat' },
      { name: 'Second-Hand Seat (Rear)', unit: 'piece', price: 150, stockQuantity: 8, minStockLevel: 2, category: 'seat_repair', description: 'Refurbished rear seat' }
    ];
    
    await Material.deleteMany({});
    const materials = await Material.insertMany(sampleMaterials);
    res.json({ message: `Seeded ${materials.length} materials`, materials });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
