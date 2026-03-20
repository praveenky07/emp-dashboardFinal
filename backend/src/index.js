const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const { protect, authorize } = require('./middleware/auth.middleware');

// Basic Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth.routes');
const timeRoutes = require('./routes/time.routes');
const leaveRoutes = require('./routes/leave.routes');
const adminRoutes = require('./routes/admin.routes');
const pulseRoutes = require('./routes/pulse.routes');
const employeeRoutes = require('./routes/employee.routes');

app.use('/api/auth', authRoutes);
app.use('/api/time', protect, timeRoutes);
app.use('/api/leave', protect, leaveRoutes);
app.use('/api/admin', protect, authorize(['Admin', 'Manager']), adminRoutes);
app.use('/api/pulse', protect, pulseRoutes);
app.use('/api/employees', protect, employeeRoutes);

app.get('/health', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
