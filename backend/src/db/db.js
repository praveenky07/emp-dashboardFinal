require('dotenv').config();
const { createClient } = require('@libsql/client');
const bcrypt = require('bcrypt');

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error('DATABASE_URL is not defined in .env');
}

if (!authToken) {
  console.warn('TURSO_AUTH_TOKEN not found');
}

const db = createClient({
  url,
  authToken,
});

const initDb = async () => {
  try {
    // Drop tables (safe for development)
    await db.execute(`DROP TABLE IF EXISTS project_assignments`);
    await db.execute(`DROP TABLE IF EXISTS projects`);
    await db.execute(`DROP TABLE IF EXISTS leave_requests`);
    await db.execute(`DROP TABLE IF EXISTS meetings`);
    await db.execute(`DROP TABLE IF EXISTS breaks`);
    await db.execute(`DROP TABLE IF EXISTS attendance`);
    await db.execute(`DROP TABLE IF EXISTS employees`);
    await db.execute(`DROP TABLE IF EXISTS departments`);
    await db.execute(`DROP TABLE IF EXISTS users`);
    await db.execute(`DROP TABLE IF EXISTS teams`);
    await db.execute(`DROP TABLE IF EXISTS activity_logs`);
    await db.execute(`DROP TABLE IF EXISTS system_settings`);

    // Create tables

    await db.execute(`
      CREATE TABLE IF NOT EXISTS teams(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  overall_productivity INTEGER DEFAULT 0
)
  `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN('employee', 'manager', 'admin')) DEFAULT 'employee',
    team_id INTEGER,
    productivity_score INTEGER DEFAULT 90,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS departments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )
  `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    employee_code TEXT UNIQUE,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(department_id) REFERENCES departments(id)
  )
  `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS attendance(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    login_time DATETIME NOT NULL,
    logout_time DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
  `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS breaks(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
  `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS meetings(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    duration INTEGER NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
  `);

    // ✅ FIXED TABLE (IMPORTANT CHANGE)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS leave_requests(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT,
    status TEXT CHECK(status IN('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES employees(id)
  )
  `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS system_settings(
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
  `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    metadata TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    deadline DATETIME,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
  )
  `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS project_assignments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(employee_id) REFERENCES employees(id)
  )
  `);

    console.log('Tables created successfully');

    // Seed data
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const managerPassword = bcrypt.hashSync('manager123', 10);
    const employeePassword = bcrypt.hashSync('employee123', 10);

    // Departments
    await db.execute("INSERT OR IGNORE INTO departments (id, name) VALUES (1, 'Engineering')");
    await db.execute("INSERT OR IGNORE INTO departments (id, name) VALUES (2, 'HR')");

    // Users
    await db.execute({
      sql: 'INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      args: [1, 'Admin', 'admin@test.com', adminPassword, 'admin']
    });

    await db.execute({
      sql: 'INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      args: [2, 'Manager', 'manager@test.com', managerPassword, 'manager']
    });

    await db.execute({
      sql: 'INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      args: [3, 'Employee', 'employee@test.com', employeePassword, 'employee']
    });

    // Employees (IMPORTANT LINK)
    await db.execute({
      sql: 'INSERT OR IGNORE INTO employees (id, user_id, name, role, department_id, employee_code) VALUES (?, ?, ?, ?, ?, ?)',
      args: [1, 1, 'Admin', 'admin', 1, 'EMP001']
    });

    await db.execute({
      sql: 'INSERT OR IGNORE INTO employees (id, user_id, name, role, department_id, employee_code) VALUES (?, ?, ?, ?, ?, ?)',
      args: [2, 2, 'Manager', 'manager', 1, 'EMP002']
    });

    await db.execute({
      sql: 'INSERT OR IGNORE INTO employees (id, user_id, name, role, department_id, employee_code) VALUES (?, ?, ?, ?, ?, ?)',
      args: [3, 3, 'Employee', 'employee', 2, 'EMP003']
    });

    console.log('Database seeded successfully');

  } catch (error) {
    console.error('Error during DB initialization:', error.message);
  }
};

initDb();

module.exports = db;
