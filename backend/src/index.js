const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error('CRITICAL ERROR: JWT_SECRET is not defined in environment variables!');
    process.exit(1);
}

const app = express();
const { protect, authorize } = require('./middleware/auth.middleware');

// Basic Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://empdashboard-wine.vercel.app"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
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
const departmentRoutes = require('./routes/department.routes');
const projectRoutes = require('./routes/project.routes');
const payrollRoutes = require('./routes/payroll.routes');
const taxRoutes = require('./routes/tax.routes');
const benefitsRoutes = require('./routes/benefits.routes');
const supportRoutes = require('./routes/support.routes');
const tasksRoutes = require('./routes/tasks.routes');
const managerRoutes = require('./routes/manager.routes');
const adjustmentRoutes = require('./routes/adjustment.routes');

// Public Routes
app.use('/api/auth', authRoutes);
app.get('/health', (req, res) => res.send('API is running...'));
app.get("/", (req, res) => res.send("Backend is running 🚀"));
app.get("/api", (req, res) => res.json({ message: "API is working ✅" }));

// Protected Routes (RBAC handled within route files)
app.use('/api/time', timeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pulse', pulseRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/benefits', benefitsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/adjustments', adjustmentRoutes);


// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.stack}`);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

