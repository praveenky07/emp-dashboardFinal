require('dotenv').config();
const { createClient } = require('@libsql/client');

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_TOKEN || process.env.AUTH_TOKEN;

if (!url) {
  throw new Error('DATABASE_URL is not defined in .env');
}
if (!authToken) {
  console.warn('Warning: DATABASE_TOKEN (or AUTH_TOKEN) is not defined in .env. Some operations might fail if the database requires authentication.');
}

const db = createClient({
  url: url,
  authToken: authToken,
});

const bcrypt = require('bcrypt');

// Initialize tables if they don't exist
const initDb = async () => {
  try {
    // Drop old tables to ensure fresh schema during refactor (Be careful in production!)
    await db.execute(`DROP TABLE IF EXISTS employees`);
    await db.execute(`DROP TABLE IF EXISTS departments`);
    await db.execute(`DROP TABLE IF EXISTS attendance`);
    await db.execute(`DROP TABLE IF EXISTS breaks`);
    await db.execute(`DROP TABLE IF EXISTS meetings`);
    await db.execute(`DROP TABLE IF EXISTS leaves`);
    await db.execute(`DROP TABLE IF EXISTS project_assignments`);
    await db.execute(`DROP TABLE IF EXISTS projects`);
    await db.execute(`DROP TABLE IF EXISTS users`);
    await db.execute(`DROP TABLE IF EXISTS teams`);
    await db.execute(`DROP TABLE IF EXISTS activity_logs`);
    await db.execute(`DROP TABLE IF EXISTS system_settings`);
    await db.execute(`DROP TABLE IF EXISTS work_sessions`); // Cleanup old table
    await db.execute(`DROP TABLE IF EXISTS leave_requests`); // Cleanup old table

    // Create Tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        overall_productivity INTEGER DEFAULT 0
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('employee', 'manager', 'admin')) DEFAULT 'employee',
        team_id INTEGER,
        productivity_score INTEGER DEFAULT 90,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        employee_code TEXT UNIQUE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (department_id) REFERENCES departments(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        login_time DATETIME NOT NULL,
        logout_time DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS breaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        duration INTEGER NOT NULL,
        type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        reason TEXT,
        status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        metadata TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        deadline DATETIME,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS project_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (employee_id) REFERENCES users(id)
      )
    `);

    console.log('Turso Database schema initialized.');

    // Seeding...
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const managerPassword = bcrypt.hashSync('manager123', 10);
    const employeePassword = bcrypt.hashSync('employee123', 10);
    
    console.log('Synchronizing initial data...');
    // Seed Departments first
    await db.execute("INSERT OR IGNORE INTO departments (name) VALUES ('Engineering')");
    await db.execute("INSERT OR IGNORE INTO departments (name) VALUES ('HR')");
    await db.execute("INSERT OR IGNORE INTO departments (name) VALUES ('Sales')");
    await db.execute("INSERT OR IGNORE INTO departments (name) VALUES ('Marketing')");

    // Seed initial users properly with departments
    await db.execute({ sql: 'INSERT INTO users (id, name, email, password, role, productivity_score) VALUES (?, ?, ?, ?, ?, ?)', args: [1, 'Admin User', 'admin@emp.com', adminPassword, 'admin', 98] });
    await db.execute({ sql: 'INSERT INTO users (id, name, email, password, role, productivity_score) VALUES (?, ?, ?, ?, ?, ?)', args: [2, 'Manager One', 'manager@emp.com', managerPassword, 'manager', 95] });
    await db.execute({ sql: 'INSERT INTO users (id, name, email, password, role, productivity_score) VALUES (?, ?, ?, ?, ?, ?)', args: [3, 'Employee One', 'employee@emp.com', employeePassword, 'employee', 92] });
    await db.execute({ sql: 'INSERT INTO users (id, name, email, password, role, productivity_score) VALUES (?, ?, ?, ?, ?, ?)', args: [4, 'John Employee', 'john@emp.com', employeePassword, 'employee', 92] });

    // Seed employees records to map users to departments
    await db.execute({ sql: 'INSERT INTO employees (user_id, name, role, department_id, employee_code) VALUES (?, ?, ?, ?, ?)', args: [1, 'Admin User', 'admin', 1, 'EMP001'] }); // Engineering
    await db.execute({ sql: 'INSERT INTO employees (user_id, name, role, department_id, employee_code) VALUES (?, ?, ?, ?, ?)', args: [2, 'Manager One', 'manager', 1, 'EMP002'] }); // Engineering
    await db.execute({ sql: 'INSERT INTO employees (user_id, name, role, department_id, employee_code) VALUES (?, ?, ?, ?, ?)', args: [3, 'Employee One', 'employee', 2, 'EMP003'] }); // HR
    await db.execute({ sql: 'INSERT INTO employees (user_id, name, role, department_id, employee_code) VALUES (?, ?, ?, ?, ?)', args: [4, 'John Employee', 'employee', 1, 'EMP004'] }); // Engineering

    await db.batch([
      { sql: 'INSERT OR IGNORE INTO teams (id, name, overall_productivity) VALUES (?, ?, ?)', args: [1, 'Frontend Squad', 94] },
      { sql: 'INSERT OR IGNORE INTO teams (id, name, overall_productivity) VALUES (?, ?, ?)', args: [2, 'Backend Core', 88] },
      { sql: 'INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)', args: ['break_limit_mins', '60'] },
      { sql: 'INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)', args: ['productivity_formula', 'work_hours - (breaks + meetings)'] }
    ], "write");
    console.log('Turso Database sync complete.');

  } catch (error) {
    console.error('Error during Turso Database initialization:', error.message);
  }
};


initDb();

module.exports = db;
