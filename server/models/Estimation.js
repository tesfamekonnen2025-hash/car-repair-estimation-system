const mongoose = require('mongoose');

const materialUsedSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: String,
  unitPrice: Number,
  totalPrice: Number
});

const estimationSchema = new mongoose.Schema({
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  carBrand: String,
  carModel: String,
  vehicleType: String,
  numberOfSeats: Number,
  workType: {
    type: String,
    enum: ['seat_repair', 'interior_decoration', 'both'],
    required: true
  },
  workDetails: {
    seatRepair: {
      seatsToRepair: Number,
      needsSponge: Boolean,
      spongeQuantity: Number,
      needsCloth: Boolean,
      clothQuantity: Number,
      needsSewing: Boolean,
      sewingQuantity: Number,
      needsGlue: Boolean,
      glueQuantity: Number,
      secondHandReplacement: Boolean
    },
    interiorDecoration: {
      roof: Boolean,
      dashboard: Boolean,
      floor: Boolean,
      clothSheetsQuantity: Number,
      plasticSheetsQuantity: Number,
      glueQuantity: Number,
      sewingAccessoriesQuantity: Number
    }
  },
  materialsUsed: [materialUsedSchema],
  laborCost: {
    type: Number,
    default: 0,
    min: 0
  },
  materialCost: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'completed', 'cancelled'],
    default: 'draft'
  },
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  completedAt: Date
});

// Index for date-based queries
estimationSchema.index({ createdAt: -1 });
estimationSchema.index({ status: 1 });

module.exports = mongoose.model('Estimation', estimationSchema);
