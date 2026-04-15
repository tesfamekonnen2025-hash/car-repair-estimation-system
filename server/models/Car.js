const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['Automobile', 'Minibus', 'Truck', 'Bus', 'Family/SUV', 'Other'],
    default: 'Automobile'
  },
  fabricMetersPerSeat: {
    type: Number,
    default: 3,
    min: 0
  },
  spongeSheetsPerSeat: {
    type: Number,
    default: 0.5,
    min: 0
  },
  glueLitersPerSeat: {
    type: Number,
    default: 0.5,
    min: 0
  },
  defaultFabricMaterialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  },
  defaultSpongeMaterialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  },
  defaultGlueMaterialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  },
  numberOfSeats: {
    type: Number,
    required: true,
    min: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
carSchema.index({ brand: 1, model: 1 });

module.exports = mongoose.model('Car', carSchema);
