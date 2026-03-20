const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    overall_productivity INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('Employee', 'Manager', 'Admin')) DEFAULT 'Employee',
    team_id INTEGER,
    productivity_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS work_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    total_duration INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS breaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES work_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    duration INTEGER NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('On Track', 'At Risk', 'Delayed', 'Urgent')) DEFAULT 'On Track',
    progress INTEGER DEFAULT 0,
    deadline TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );
`);

// Check if team_id column exists in users (migration for existing DB)
try {
  db.exec('ALTER TABLE users ADD COLUMN team_id INTEGER REFERENCES teams(id)');
} catch (e) {
  // Column might already exist
}
try {
  db.exec('ALTER TABLE users ADD COLUMN productivity_score INTEGER DEFAULT 0');
} catch (e) {
  // Column might already exist
}

// Seed Teams
const insertTeam = db.prepare('INSERT OR IGNORE INTO teams (id, name, overall_productivity) VALUES (?, ?, ?)');
insertTeam.run(1, 'Frontend Squad', 94);
insertTeam.run(2, 'Backend Core', 88);
insertTeam.run(3, 'Design Systems', 72);

// Seed Users
const bcrypt = require('bcrypt');
const adminPassword = bcrypt.hashSync('admin123', 10);
const managerPassword = bcrypt.hashSync('manager123', 10);
const employeePassword = bcrypt.hashSync('employee123', 10);

const insertUser = db.prepare('INSERT OR IGNORE INTO users (name, email, password, role, team_id, productivity_score) VALUES (?, ?, ?, ?, ?, ?)');
insertUser.run('Admin User', 'admin@emp.com', adminPassword, 'Admin', null, 98);
insertUser.run('Manager One', 'manager@emp.com', managerPassword, 'Manager', null, 95);
insertUser.run('John Employee', 'john@emp.com', employeePassword, 'Employee', 1, 92);
insertUser.run('Sarah Frontend', 'sarah@emp.com', employeePassword, 'Employee', 1, 96);
insertUser.run('Mike Backend', 'mike@emp.com', employeePassword, 'Employee', 2, 85);

// Seed Projects
const insertProject = db.prepare('INSERT OR IGNORE INTO projects (name, team_id, status, progress, deadline) VALUES (?, ?, ?, ?, ?)');
insertProject.run('EMP UI Redesign', 1, 'On Track', 75, '2026-04-15');
insertProject.run('Dashboard API v2', 2, 'Delayed', 40, '2026-03-25');
insertProject.run('HR Module Integration', 1, 'At Risk', 60, '2026-03-24');
insertProject.run('Mobile App Alpha', 1, 'Urgent', 20, '2026-03-22');

// Seed default settings
const upsertSetting = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
upsertSetting.run('break_limit_mins', '60');
upsertSetting.run('productivity_formula', 'work_hours / (work_hours + break_hours)');

module.exports = db;
