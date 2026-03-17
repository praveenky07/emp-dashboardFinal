const db = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
    try {
        const password = await bcrypt.hash('password123', 10);
        
        // Add a Manager
        await db.runAsync(`
            INSERT INTO employees (name, email, username, password, role, department, salary, joining_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, ['Mike Manager', 'manager@company.com', 'mgr1', password, 'Manager', 'Engineering', 95000, '2023-01-15']);

        // Add an Employee
        await db.runAsync(`
            INSERT INTO employees (name, email, username, password, role, department, salary, joining_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, ['Emily Employee', 'emp@company.com', 'emp1', password, 'Employee', 'Design', 65000, '2023-06-01']);

        console.log('Database seeded with test users.');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        process.exit();
    }
}

seed();
