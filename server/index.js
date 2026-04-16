const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car_repair_estimation';

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB Atlas successfully');
    console.log('Database Name:', mongoose.connection.name);
  } catch (err) {
    console.error('CRITICAL: MongoDB connection error:', err.message);
    // Don't exit process, let Render health check handle it or retry
  }
};

connectDB();

// Remove dns.setServers as it can break internal networking on Render
// dns.setServers(['8.8.8.8', '1.1.1.1']); 

// Add connection monitoring
mongoose.connection.on('error', err => {
  console.error('Mongoose runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Routes
app.use('/api/cars', require('./routes/cars'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/estimations', require('./routes/estimations'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus
  });
});

// Serve static files from React build (Render / production deploy)
const clientBuildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
