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
      CREATE TABLE IF NOT EXISTS work_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        total_duration INTEGER DEFAULT 0
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS breaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        duration INTEGER DEFAULT 0
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        duration INTEGER NOT NULL,
        type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        team_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('On Track', 'At Risk', 'Delayed', 'Urgent')) DEFAULT 'On Track',
        progress INTEGER DEFAULT 0,
        deadline TEXT NOT NULL
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

    // Added as per user request
    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('Present', 'Absent', 'Late')) DEFAULT 'Present',
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )
    `);

    console.log('Turso Database schema initialized.');

    // Seeding...
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const managerPassword = bcrypt.hashSync('manager123', 10);
    const employeePassword = bcrypt.hashSync('employee123', 10);
    
    console.log('Synchronizing initial data...');
    await db.batch([
      { sql: 'INSERT OR IGNORE INTO teams (id, name, overall_productivity) VALUES (?, ?, ?)', args: [1, 'Frontend Squad', 94] },
      { sql: 'INSERT OR IGNORE INTO teams (id, name, overall_productivity) VALUES (?, ?, ?)', args: [2, 'Backend Core', 88] },
      { sql: 'INSERT OR IGNORE INTO users (name, email, password, role, productivity_score) VALUES (?, ?, ?, ?, ?)', args: ['Admin User', 'admin@emp.com', adminPassword, 'admin', 98] },
      { sql: 'INSERT OR IGNORE INTO users (name, email, password, role, productivity_score) VALUES (?, ?, ?, ?, ?)', args: ['Manager One', 'manager@emp.com', managerPassword, 'manager', 95] },
      { sql: 'INSERT OR IGNORE INTO users (name, email, password, role, productivity_score) VALUES (?, ?, ?, ?, ?)', args: ['Employee One', 'employee@emp.com', employeePassword, 'employee', 92] },
      { sql: 'INSERT OR IGNORE INTO users (name, email, password, role, productivity_score) VALUES (?, ?, ?, ?, ?)', args: ['John Employee', 'john@emp.com', employeePassword, 'employee', 92] },
      { sql: 'INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)', args: ['break_limit_mins', '60'] },
      { sql: 'INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)', args: ['productivity_formula', 'work_hours / (work_hours + break_hours)'] }
    ], "write");
    console.log('Turso Database sync complete.');

  } catch (error) {
    console.error('Error during Turso Database initialization:', error.message);
  }
};

initDb();

module.exports = db;
