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

app.use('/api/auth', authRoutes);
app.use('/api/time', protect, timeRoutes);
app.use('/api/leave', protect, leaveRoutes);
app.use('/api/admin', protect, authorize(['Admin', 'Manager']), adminRoutes);
app.use('/api/pulse', protect, pulseRoutes);
app.use('/api/employees', protect, employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/projects', projectRoutes);


app.get('/health', (req, res) => res.send('API is running...'));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.stack}`);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

app.get("/api", (req, res) => {
    res.json({ message: "API is working ✅" });
});
app.get("/fix-user", async (req, res) => {
    const bcrypt = require("bcrypt");
    const { db } = require("./db/db");

    try {
        await db.execute("PRAGMA foreign_keys = OFF");

        await db.execute("DELETE FROM employees");
        await db.execute("DELETE FROM users");

        const hashed = await bcrypt.hash("admin123", 10);

        // ✅ Insert user
        await db.execute({
            sql: `INSERT INTO users (id, name, email, password, role)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [1, 'Admin', 'admin@test.com', hashed, 'admin']
        });

        // ✅ Insert employee (WITHOUT role)
        await db.execute({
            sql: `INSERT INTO employees (id, user_id, name)
                  VALUES (?, ?, ?)`,
            args: [1, 1, 'Admin']
        });

        await db.execute("PRAGMA foreign_keys = ON");

        res.send("User fixed ✅");

    } catch (err) {
        console.error("FIX ERROR:", err); // 👈 IMPORTANT
        res.status(500).send("Fix failed ❌");
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

