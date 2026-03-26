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
        role TEXT CHECK(role IN('employee', 'manager', 'admin', 'hr')) DEFAULT 'employee',
        team_id INTEGER,
        manager_id INTEGER,
        productivity_score INTEGER DEFAULT 90,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(manager_id) REFERENCES users(id)
      )
    `);

    // Safe column migrations for existing instances
    try {
      await db.execute('ALTER TABLE users ADD COLUMN manager_id INTEGER REFERENCES users(id)');
      console.log('Added manager_id to users table');
    } catch (e) { /* Column already exists */ }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS leaves(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        manager_id INTEGER,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        reason TEXT,
        status TEXT CHECK(status IN('Pending', 'Approved', 'Rejected', 'Cancelled')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(manager_id) REFERENCES users(id)
      )
    `);

    try {
      await db.execute('ALTER TABLE leaves ADD COLUMN manager_id INTEGER REFERENCES users(id)');
      console.log('Added manager_id to leaves table');
    } catch (e) { /* Column already exists */ }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS salary_history(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        old_salary REAL NOT NULL,
        new_salary REAL NOT NULL,
        updated_by INTEGER NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(updated_by) REFERENCES users(id)
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
        salary REAL DEFAULT 0,
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
        team_id INTEGER,
        progress INTEGER DEFAULT 0,
        status TEXT DEFAULT 'On Track',
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id),
        FOREIGN KEY(team_id) REFERENCES teams(id)
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

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN('Pending', 'In Progress', 'Completed')) DEFAULT 'Pending',
        priority TEXT CHECK(priority IN('Low', 'Medium', 'High')) DEFAULT 'Medium',
        due_date DATE,
        assigned_to INTEGER NOT NULL,
        assigned_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(assigned_to) REFERENCES users(id),
        FOREIGN KEY(assigned_by) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS payslips(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        base_salary REAL NOT NULL,
        hra REAL DEFAULT 0,
        allowances REAL DEFAULT 0,
        bonus REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        pf REAL DEFAULT 0,
        insurance REAL DEFAULT 0,
        net_salary REAL NOT NULL,
        status TEXT DEFAULT 'Paid',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Safe migrations for payslips
    try {
      await db.execute('CREATE UNIQUE INDEX idx_payslip_user_month_year ON payslips(user_id, month, year)');
      console.log('Added unique index to payslips');
    } catch (e) { /* index already exists */ }

    const payslipCols = ['hra', 'allowances', 'pf', 'insurance'];
    for (const col of payslipCols) {
      try {
        await db.execute(`ALTER TABLE payslips ADD COLUMN ${col} REAL DEFAULT 0`);
      } catch (e) { /* Col exists */ }
    }

    // Leave system: add appliedTo if missing
    try {
      await db.execute('ALTER TABLE leaves ADD COLUMN appliedTo INTEGER REFERENCES users(id)');
      console.log('Added appliedTo to leaves table');
    } catch (e) { /* Already exists */ }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS salary_adjustments(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT CHECK(type IN('bonus', 'incentive', 'deduction', 'other')) NOT NULL,
        description TEXT,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tax_declarations(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        financial_year TEXT NOT NULL,
        section_80c REAL DEFAULT 0,
        section_80d REAL DEFAULT 0,
        house_rent REAL DEFAULT 0,
        other_investments REAL DEFAULT 0,
        status TEXT CHECK(status IN('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS benefit_plans(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        max_limit REAL NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_benefits(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        benefit_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'Active',
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(benefit_id) REFERENCES benefit_plans(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS leave_balances(
        user_id INTEGER PRIMARY KEY,
        sick_leave INTEGER DEFAULT 12,
        casual_leave INTEGER DEFAULT 12,
        earned_leave INTEGER DEFAULT 15,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS regularization_requests(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        actual_in DATETIME NOT NULL,
        actual_out DATETIME NOT NULL,
        reason TEXT NOT NULL,
        status TEXT CHECK(status IN('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS delegations(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manager_id INTEGER NOT NULL,
        delegate_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        FOREIGN KEY(manager_id) REFERENCES users(id),
        FOREIGN KEY(delegate_id) REFERENCES users(id)
      )
    `);



    console.log('Tables created successfully');

    // Seed data
    const adminHash = bcrypt.hashSync('admin123', 10);
    const managerHash = bcrypt.hashSync('manager123', 10);
    const employeeHash = bcrypt.hashSync('employee123', 10);
    const hrHash = bcrypt.hashSync('hr123', 10);
    const defaultHash = bcrypt.hashSync('123456', 10);

    // Departments
    await db.execute("INSERT OR IGNORE INTO departments (id, name) VALUES (1, 'Engineering')");
    await db.execute("INSERT OR IGNORE INTO departments (id, name) VALUES (2, 'HR')");

    // Users (Force update for testing consistency)
    // README @emp.com users
    await db.execute({
      sql: 'INSERT OR REPLACE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      args: [1, 'System Admin', 'admin@emp.com', adminHash, 'admin']
    });

    await db.execute({
      sql: 'INSERT OR REPLACE INTO users (id, name, email, password, role, team_id, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [2, 'Team Lead', 'manager@emp.com', managerHash, 'manager', 1, 1]
    });

    await db.execute({
      sql: 'INSERT OR REPLACE INTO users (id, name, email, password, role, team_id, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [3, 'Product Engineer', 'employee@emp.com', employeeHash, 'employee', 1, 2]
    });

    // Original @test.com users (keeping for backwards compatibility with some tests)
    await db.execute({
      sql: 'INSERT OR REPLACE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      args: [11, 'Admin Test', 'admin@test.com', adminHash, 'admin']
    });

    await db.execute({
      sql: 'INSERT OR REPLACE INTO users (id, name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?, ?)',
      args: [12, 'Manager Test', 'manager@test.com', managerHash, 'manager', 11]
    });

    await db.execute({
      sql: 'INSERT OR REPLACE INTO users (id, name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?, ?)',
      args: [13, 'Employee Test', 'employee@test.com', employeeHash, 'employee', 12]
    });

    await db.execute({
      sql: 'INSERT OR REPLACE INTO users (id, name, email, password, role, team_id, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [4, 'HR Professional', 'hr@test.com', hrHash, 'hr', 2, 2]
    });


    // Seed Teams
    await db.execute("INSERT OR IGNORE INTO teams (id, name, overall_productivity) VALUES (1, 'Frontend Squad', 94)");
    await db.execute("INSERT OR IGNORE INTO teams (id, name, overall_productivity) VALUES (2, 'Backend Core', 88)");

    // Seed Projects
    await db.execute("INSERT OR IGNORE INTO projects (id, name, description, deadline, team_id, progress, status, created_by) VALUES (1, 'Design Systems', 'Building out the new component library', date('now', '+5 days'), 1, 85, 'On Track', 1)");
    await db.execute("INSERT OR IGNORE INTO projects (id, name, description, deadline, team_id, progress, status, created_by) VALUES (2, 'Mobile Alpha', 'First release of the mobile app', date('now', '+3 days'), 1, 60, 'At Risk', 1)");


    // Employees (Link to Users)
    await db.execute({
      sql: 'INSERT OR REPLACE INTO employees (id, user_id, name, role, department_id, employee_code) VALUES (?, ?, ?, ?, ?, ?)',
      args: [1, 1, 'System Admin', 'admin', 1, 'EMP001']
    });

    await db.execute({
      sql: 'INSERT OR REPLACE INTO employees (id, user_id, name, role, department_id, employee_code) VALUES (?, ?, ?, ?, ?, ?)',
      args: [2, 2, 'Team Lead', 'manager', 1, 'EMP002']
    });

    await db.execute({
      sql: 'INSERT OR REPLACE INTO employees (id, user_id, name, role, department_id, employee_code, salary) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [3, 3, 'Product Engineer', 'employee', 1, 'EMP003', 60000]
    });

    await db.execute({
      sql: 'INSERT OR REPLACE INTO employees (id, user_id, name, role, department_id, employee_code, salary) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [4, 4, 'HR Professional', 'hr', 2, 'EMP004', 65000]
    });



    // 1. Leave Balances for all users
    for(let i=1; i<=3; i++) {
        await db.execute(`INSERT OR IGNORE INTO leave_balances (user_id, sick_leave, casual_leave, earned_leave) VALUES (${i}, 12, 12, 15)`);
    }

    // 2. Benefit Plans
    const plans = [
        [1, 'Medical & Health', 'Complete family health coverage under group policy', 8000],
        [2, 'Internet & Telecom', 'Work from home connectivity reimbursement', 2000],
        [3, 'LTA Reimbursement', 'Annual leave travel allowance claims', 25000],
        [4, 'Learning & Certs', 'Professional growth and skill upscaling fund', 15000]
    ];
    for (const p of plans) {
        await db.execute({ sql: "INSERT OR IGNORE INTO benefit_plans (id, name, description, max_limit) VALUES (?, ?, ?, ?)", args: p });
    }

    // 3. Payslips for the users (JAN, FEB, MAR)
    const monthsData = [
        { name: 'January', year: 2026, bonus: 500, tax: 450, pf: 200, allowances: 300 },
        { name: 'February', year: 2026, bonus: 0, tax: 420, pf: 200, allowances: 300 },
        { name: 'March', year: 2026, bonus: 1200, tax: 550, pf: 200, allowances: 300 }
    ];

    for (const m of monthsData) {
        // Employee (3)
        const earned3 = 6000 + m.bonus + m.allowances + 1200; // base + bonus + allowances + hra(approx)
        const ded3 = m.tax + m.pf + 150; // tax + pf + insurance
        await db.execute({
            sql: 'INSERT OR IGNORE INTO payslips (user_id, month, year, base_salary, bonus, allowances, hra, tax, pf, insurance, net_salary, status) VALUES (?, ?, ?, 6000, ?, ?, 1200, ?, ?, 150, ?, ?)',
            args: [3, m.name, m.year, m.bonus, m.allowances, m.tax, m.pf, (earned3-ded3), 'Paid']
        });
        // Manager (2)
        const earned2 = 8500 + (m.bonus*1.5) + m.allowances + 1800;
        const ded2 = (m.tax*1.5) + (m.pf*1.2) + 200;
        await db.execute({
            sql: 'INSERT OR IGNORE INTO payslips (user_id, month, year, base_salary, bonus, allowances, hra, tax, pf, insurance, net_salary, status) VALUES (?, ?, ?, 8500, ?, ?, 1800, ?, ?, 200, ?, ?)',
            args: [2, m.name, m.year, m.bonus*1.5, m.allowances, m.tax*1.5, m.pf*1.2, (earned2-ded2), 'Paid']
        });
    }

    // 4. Sample Leave Data (Employee -> Manager, Manager -> Admin)
    const leavesData = [
        { userId: 3, appliedTo: 2, start: '2026-04-10', end: '2026-04-12', reason: 'Family vacation', status: 'Pending' },
        { userId: 3, appliedTo: 2, start: '2026-03-01', end: '2026-03-02', reason: 'Personal work', status: 'Approved' },
        { userId: 2, appliedTo: 1, start: '2026-04-20', end: '2026-04-25', reason: 'Conference trip', status: 'Pending' },
        { userId: 3, appliedTo: 2, start: '2026-02-15', end: '2026-02-16', reason: 'Sick leave', status: 'Rejected' }
    ];

    for (const l of leavesData) {
        await db.execute({
            sql: 'INSERT OR IGNORE INTO leaves (user_id, appliedTo, manager_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [l.userId, l.appliedTo, l.appliedTo, l.start, l.end, l.reason, l.status]
        });
    }

    // 5. Explicit Test Leave for verification (Employee -> Manager)
    await db.execute({
        sql: 'INSERT OR IGNORE INTO leaves (user_id, appliedTo, manager_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [3, 2, 2, "2026-05-01", "2026-05-02", "Verification Test Leave", "Pending"]
    });

    // 6. Mock Activity for Productivity Stats
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    for (let u = 1; u <= 3; u++) {
        // Attendance
        await db.execute({
            sql: "INSERT OR IGNORE INTO attendance (user_id, login_time, logout_time) VALUES (?, ?, ?)",
            args: [u, `${todayStr}T09:00:00`, `${todayStr}T18:00:00`]
        });
        // Meetings
        await db.execute({
            sql: "INSERT OR IGNORE INTO meetings (user_id, title, duration, type) VALUES (?, ?, ?, ?)",
            args: [u, 'Daily Standup', 1800, 'Internal']
        });
        await db.execute({
            sql: "INSERT OR IGNORE INTO meetings (user_id, title, duration, type) VALUES (?, ?, ?, ?)",
            args: [u, 'Project Review', 3600, 'External']
        });
    }

    console.log('[SEED] Master records and activity logs initialized.');

  } catch (error) {
    console.error('[CRITICAL] DB initialization error:', error.message);
  }
};

initDb();

module.exports = { db };

