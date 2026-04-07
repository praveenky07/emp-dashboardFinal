const { db } = require('./src/db/db');
const bcrypt = require('bcrypt');

async function migrateRoles() {
    try {
        await db.execute('PRAGMA foreign_keys=off;');
        
        // 1. Recreate users table to allow 'hr' role
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users_new(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT CHECK(role IN('employee', 'manager', 'admin', 'hr')) DEFAULT 'employee',
                team_id INTEGER,
                productivity_score INTEGER DEFAULT 90,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await db.execute(`INSERT INTO users_new SELECT * FROM users`);
        await db.execute(`DROP TABLE users`);
        await db.execute(`ALTER TABLE users_new RENAME TO users`);
        
        // 2. Add salary to employees
        try {
            await db.execute('ALTER TABLE employees ADD COLUMN salary REAL DEFAULT 0');
            console.log('Added salary to employees');
        } catch (e) {
            console.log('Salary column may already exist ->', e.message);
        }

        // 3. Seed HR User
        const passwordHash = bcrypt.hashSync('123456', 10);
        await db.execute({
            sql: 'INSERT OR REPLACE INTO users (id, name, email, password, role, team_id) VALUES (?, ?, ?, ?, ?, ?)',
            args: [4, 'HR Professional', 'hr@test.com', passwordHash, 'hr', 2] // team_id 2 just as dummy
        });
        
        // Employee entry for HR
        await db.execute({
            sql: 'INSERT OR IGNORE INTO employees (id, user_id, name, role, department_id, employee_code, salary) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [4, 4, 'HR Professional', 'hr', 2, 'EMP004', 65000]
        });

        // Seed default salaries
        await db.execute("UPDATE employees SET salary = 95000 WHERE id = 1"); // Admin
        await db.execute("UPDATE employees SET salary = 85000 WHERE id = 2"); // Manager
        await db.execute("UPDATE employees SET salary = 60000 WHERE id = 3"); // Employee

        await db.execute('PRAGMA foreign_keys=on;');
        console.log("Migration complete: Added HR role and User, and added Salary to employees.");

    } catch(err) {
        console.error(err);
    }
}
migrateRoles();
