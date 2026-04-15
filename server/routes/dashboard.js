const express = require('express');
const router = express.Router();
const Estimation = require('../models/Estimation');
const Material = require('../models/Material');

// GET dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Total estimations
    const totalEstimations = await Estimation.countDocuments();
    const todayEstimations = await Estimation.countDocuments({ 
      createdAt: { $gte: today } 
    });
    const monthEstimations = await Estimation.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    
    // Estimations by status
    const confirmedEstimations = await Estimation.countDocuments({ status: 'confirmed' });
    const completedEstimations = await Estimation.countDocuments({ status: 'completed' });
    const draftEstimations = await Estimation.countDocuments({ status: 'draft' });
    
    // Revenue calculations
    const allEstimations = await Estimation.find({ 
      status: { $in: ['confirmed', 'completed'] } 
    });
    
    const totalRevenue = allEstimations.reduce((sum, est) => sum + est.totalCost, 0);
    
    const todayRevenueResult = await Estimation.aggregate([
      { $match: { createdAt: { $gte: today }, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const todayRevenue = todayRevenueResult[0]?.total || 0;
    
    const monthRevenueResult = await Estimation.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const monthRevenue = monthRevenueResult[0]?.total || 0;
    
    // Stock alerts
    const lowStockMaterials = await Material.find({
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }
    }).sort({ stockQuantity: 1 });
    
    // Total materials count
    const totalMaterials = await Material.countDocuments();
    const lowStockCount = lowStockMaterials.length;
    
    // Recent activity (last 10 estimations)
    const recentEstimations = await Estimation.find()
      .populate('carId', 'brand model')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Work type distribution
    const workTypeStats = await Estimation.aggregate([
      { $group: { _id: '$workType', count: { $sum: 1 } } }
    ]);
    
    // Monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrend = await Estimation.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: ['confirmed', 'completed'] }
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalCost' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      estimations: {
        total: totalEstimations,
        today: todayEstimations,
        thisMonth: monthEstimations,
        confirmed: confirmedEstimations,
        completed: completedEstimations,
        draft: draftEstimations
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        thisMonth: monthRevenue
      },
      stock: {
        totalMaterials,
        lowStockCount,
        lowStockMaterials: lowStockMaterials.map(m => ({
          id: m._id,
          name: m.name,
          quantity: m.stockQuantity,
          minLevel: m.minStockLevel,
          unit: m.unit
        }))
      },
      recentActivity: recentEstimations,
      workTypeDistribution: workTypeStats,
      monthlyTrend
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET recent estimations
router.get('/recent-estimations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const estimations = await Estimation.find()
      .populate('carId', 'brand model')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json(estimations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET low stock alerts
router.get('/stock-alerts', async (req, res) => {
  try {
    const materials = await Material.find({
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }
    }).sort({ stockQuantity: 1 });
    
    res.json(materials.map(m => ({
      id: m._id,
      name: m.name,
      currentStock: m.stockQuantity,
      minLevel: m.minStockLevel,
      unit: m.unit,
      category: m.category
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
