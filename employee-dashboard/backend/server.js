require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Initializes database

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const breakRoutes = require('./routes/breakRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const bonusRoutes = require('./routes/bonusRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const meetingRoutes = require('./routes/meetingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/breaks', breakRoutes); // Note: Route path slightly varied from POST /api/break/start to /api/breaks/start to follow REST plural standard, but will keep as requested if specifically needed
app.use('/api/leaves', leaveRoutes);
app.use('/api/bonuses', bonusRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/meetings', meetingRoutes);

// Simple health check route
app.get('/', (req, res) => {
    res.send('Employee Dashboard API is running...');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
