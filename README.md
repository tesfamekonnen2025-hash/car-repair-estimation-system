# Car Seat Repair & Interior Decoration Estimation System

A comprehensive web-based system for managing car seat repair and interior decoration cost estimations, inventory tracking, and business analytics.

## Features

### Core Functionality
- **Accurate Cost Estimation**: Calculate repair costs based on car type, work category, and materials needed
- **Multi-Brand Support**: Pre-configured database with popular car brands and models
- **Automatic Material Calculation**: System calculates material quantities based on car specifications
- **Real-Time Inventory Tracking**: Stock levels update automatically when estimations are confirmed
- **Comprehensive Dashboard**: Visual overview of business metrics and low-stock alerts

### Work Categories
1. **Car Seat Repair**
   - Sponge replacement
   - Cloth/fabric replacement
   - Sewing accessories
   - Adhesive/glue
   - Second-hand seat replacement option

2. **Interior Decoration**
   - Roof lining
   - Dashboard covering
   - Floor carpet installation

### Inventory Management
- Material database with unit pricing
- Stock level monitoring with low-stock alerts
- Automatic stock deduction on confirmed jobs
- Stock adjustment functionality (add/remove/set)

### Reporting & Analytics
- Revenue tracking by work type
- Daily/Monthly trend analysis
- Material usage reports
- Export to CSV functionality

## System Architecture

### Tech Stack
- **Frontend**: React 18, React Router, Recharts (visualization), Lucide React (icons)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Styling**: Custom CSS with CSS Variables

### Database Schema

**Cars Collection**
- Brand, Model, Number of Seats

**Materials Collection**
- Name, Unit, Price, Stock Quantity, Min Stock Level, Category

**Estimations Collection**
- Car Reference, Work Type, Materials Used, Costs, Status, Customer Info

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Clone and Install Dependencies

```bash
# Navigate to project directory
cd "c:\Users\CBE\Documents\Esayas tapisery"

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Step 2: Configure Environment

Create a `.env` file in the `server` directory:

```env
MONGODB_URI=mongodb://localhost:27017/car_repair_estimation
PORT=5000
NODE_ENV=development
```

For MongoDB Atlas, use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/car_repair_estimation
```

### Step 3: Start MongoDB

**Windows:**
```bash
# If MongoDB is installed as a service
net start MongoDB

# Or run manually
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Linux/Mac:**
```bash
sudo systemctl start mongod
```

### Step 4: Run the Application

**Development Mode (runs both frontend and backend):**
```bash
npm run dev
```

**Or run separately:**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Step 5: Seed Sample Data (Optional)

1. Open the application in browser
2. Navigate to **Car Management** and click **"Load Sample Data"**
3. Navigate to **Materials & Stock** and click **"Load Sample Data"**

## Usage Guide

### Creating a New Estimation

1. Click **"New Estimation"** in the sidebar
2. **Step 1**: Select car brand and model
3. **Step 2**: Choose work type (Seat Repair, Interior Decoration, or Both)
   - Select required materials and options
   - Adjust labor cost per seat if needed
4. **Step 3**: Enter customer information (optional)
5. Click **"Calculate Estimation"** to see the cost breakdown
6. Review the summary and click **"Save Estimation"**

### Managing Inventory

1. Navigate to **Materials & Stock**
2. View all materials with current stock levels
3. Click the **+** icon next to stock quantity to update
4. Add new materials with the **"Add Material"** button
5. Low stock items are highlighted in yellow/red

### Confirming an Estimation

1. Go to **Estimations** page
2. Find the draft estimation
3. Click the **checkmark** icon to confirm
4. This automatically deducts materials from stock

### Viewing Reports

1. Navigate to **Reports**
2. Select date range and report type
3. View charts and export data to CSV

## API Endpoints

### Cars
- `GET /api/cars` - List all cars
- `GET /api/cars/brands` - Get unique brands
- `GET /api/cars/brand/:brand/models` - Get models by brand
- `POST /api/cars` - Add new car
- `PUT /api/cars/:id` - Update car
- `DELETE /api/cars/:id` - Delete car
- `POST /api/cars/seed` - Load sample car data

### Materials
- `GET /api/materials` - List all materials
- `POST /api/materials` - Add new material
- `PUT /api/materials/:id` - Update material
- `PUT /api/materials/:id/stock` - Update stock quantity
- `DELETE /api/materials/:id` - Delete material
- `POST /api/materials/seed` - Load sample material data

### Estimations
- `GET /api/estimations` - List estimations
- `GET /api/estimations/:id` - Get estimation details
- `POST /api/estimations/calculate` - Preview calculation
- `POST /api/estimations` - Create estimation
- `PUT /api/estimations/:id/confirm` - Confirm and deduct stock
- `PUT /api/estimations/:id/complete` - Mark as completed
- `PUT /api/estimations/:id/cancel` - Cancel estimation
- `DELETE /api/estimations/:id` - Delete estimation

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## File Structure

```
car-repair-estimation/
├── server/
│   ├── index.js              # Main server entry
│   ├── .env                  # Environment variables
│   ├── models/
│   │   ├── Car.js            # Car model schema
│   │   ├── Material.js       # Material model schema
│   │   └── Estimation.js     # Estimation model schema
│   └── routes/
│       ├── cars.js           # Car API routes
│       ├── materials.js      # Material API routes
│       ├── estimations.js    # Estimation API routes
│       └── dashboard.js      # Dashboard API routes
├── client/
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── index.js          # React entry point
│   │   ├── styles.css        # Main stylesheet
│   │   ├── components/
│   │   │   ├── Sidebar.js    # Navigation sidebar
│   │   │   ├── StatCard.js   # Dashboard stat card
│   │   │   ├── AlertBanner.js # Alert notifications
│   │   │   └── ConfirmModal.js # Confirmation dialog
│   │   └── pages/
│   │       ├── Dashboard.js   # Dashboard page
│   │       ├── NewEstimation.js # New estimation form
│   │       ├── Estimations.js # Estimations list
│   │       ├── CarManagement.js # Car CRUD
│   │       ├── MaterialStock.js # Inventory management
│   │       └── Reports.js     # Analytics & reports
│   └── package.json
├── package.json
└── README.md
```

## Material Calculation Logic

The system automatically calculates material requirements based on:

### Seat Repair
- **Sponge**: 0.5 sheets per seat
- **Fabric**: 3 meters per seat
- **Sewing accessories**: 1 set per 2 seats
- **Glue**: 0.5 liter per seat

### Interior Decoration
- **Roof lining**: 3 meters (standard car)
- **Dashboard**: 1 sheet
- **Floor carpet**: 4-6 meters based on car size

## Customization

### Adding New Materials
Edit the seed function in `server/routes/materials.js` to add default materials.

### Modifying Labor Costs
Update the `laborCostPerSeat` default value in the estimation form.

### Changing Currency
Modify the `formatCurrency` function in all page components.

## Troubleshooting

### MongoDB Connection Issues
```bash
# Test MongoDB connection
mongo --eval "db.runCommand({ connectionStatus: 1 })"
```

### Port Already in Use
```bash
# Find and kill process using port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Node Modules Issues
```bash
# Clean and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

## License

This project is created for commercial use.

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify MongoDB is running
3. Ensure all dependencies are installed
4. Check server logs for API errors

## Future Enhancements

- User authentication and roles
- Multi-currency support
- PDF report generation
- Customer management module
- Supplier management
- Advanced analytics with date range filtering
- Mobile app companion
- SMS/email notifications for low stock
