require('dotenv').config();
const { createClient } = require('@libsql/client');
const bcrypt = require('bcrypt');

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error('DATABASE_URL is not defined in .env');
}

const db = createClient({
  url,
  authToken,
});

const initDb = async () => {
  try {
    // 1. Core Structure
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN('employee', 'manager', 'admin', 'hr')) DEFAULT 'employee',
        manager_id INTEGER,
        department_id INTEGER,
        profile_image TEXT,
        github_id TEXT UNIQUE,
        productivity_score INTEGER DEFAULT 90,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(manager_id) REFERENCES users(id)
      )
    `);

    // 2. Organization Units
    await db.execute(`
      CREATE TABLE IF NOT EXISTS departments(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS teams(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        overall_productivity INTEGER DEFAULT 0
      )
    `);

    // 3. Employee Profiles (Extended data linked to users)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        employee_code TEXT UNIQUE,
        salary REAL DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(department_id) REFERENCES departments(id)
      )
    `);

    // 4. Attendance & Time Tracking (Guarding against duplicates)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS attendance(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        clock_in TEXT NOT NULL,
        clock_out TEXT,
        total_hours REAL DEFAULT 0,
        status TEXT DEFAULT 'Present',
        UNIQUE(user_id, date),
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

    // 5. Leave Management
    await db.execute(`
      CREATE TABLE IF NOT EXISTS leaves(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        manager_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        type TEXT CHECK(type IN('Sick', 'Casual', 'Earned')) DEFAULT 'Casual',
        reason TEXT,
        status TEXT CHECK(status IN('Pending', 'Approved', 'Rejected', 'Cancelled')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(manager_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS leave_balances(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_leaves INTEGER DEFAULT 18,
        used_leaves INTEGER DEFAULT 0,
        remaining_leaves INTEGER DEFAULT 18,
        year INTEGER NOT NULL,
        UNIQUE(user_id, year),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // 6. Meetings & Collaboration
    await db.execute(`
      CREATE TABLE IF NOT EXISTS meetings(
        id TEXT PRIMARY KEY,
        purpose TEXT NOT NULL,
        duration INTEGER NOT NULL,
        category TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        participants TEXT,
        meeting_link TEXT,
        video_link TEXT,
        room_id TEXT,
        status TEXT DEFAULT 'scheduled',
        scheduled_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS meeting_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(meeting_id) REFERENCES meetings(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // 7. Communication
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        file_url TEXT,
        file_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sender_id) REFERENCES users(id),
        FOREIGN KEY(receiver_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS group_messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT NOT NULL,
        sender_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        file_url TEXT,
        file_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sender_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // 8. Performance & Finance
    await db.execute(`
      CREATE TABLE IF NOT EXISTS performance_reviews(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        rating INTEGER CHECK(rating BETWEEN 1 AND 5),
        feedback TEXT,
        tags TEXT, 
        period TEXT NOT NULL, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(reviewer_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS bonuses(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        manager_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(employee_id) REFERENCES users(id),
        FOREIGN KEY(manager_id) REFERENCES users(id)
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
        UNIQUE(user_id, month, year),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // 9. Logs & Settings
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
        ip_address TEXT,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration logic for existing tables (ensure constraints apply)
    try {
        await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_att_user_date ON attendance(user_id, date)');
        await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_lb_user_year ON leave_balances(user_id, year)');
    } catch (e) { console.warn('[DB] Index migration warning:', e.message); }

    console.log('[DB] Core schema verified and interconnected.');

    // Seeding Logic (Clean Boot)
    const adminHash = bcrypt.hashSync('admin123', 10);
    const managerHash = bcrypt.hashSync('manager123', 10);
    const employeeHash = bcrypt.hashSync('employee123', 10);

    // Initial Master Users
    const usersToSeed = [
        [1, 'System Admin', 'admin@emp.com', adminHash, 'admin', null],
        [2, 'Team Lead', 'manager@emp.com', managerHash, 'manager', 1],
        [3, 'Product Engineer', 'employee@emp.com', employeeHash, 'employee', 2]
    ];

    for (const u of usersToSeed) {
        await db.execute({
            sql: 'INSERT OR IGNORE INTO users (id, name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?, ?)',
            args: u
        });
    }

    // Master Departments
    await db.execute("INSERT OR IGNORE INTO departments (id, name) VALUES (1, 'Engineering')");
    await db.execute("INSERT OR IGNORE INTO departments (id, name) VALUES (2, 'Product')");

    // Master Employees (Linking)
    const empToSeed = [
        [1, 1, 'System Admin', 'admin', 1, 'EMP001', 120000],
        [2, 2, 'Team Lead', 'manager', 1, 'EMP002', 80000],
        [3, 3, 'Product Engineer', 'employee', 2, 'EMP003', 60000]
    ];
    for (const e of empToSeed) {
        await db.execute({
            sql: 'INSERT OR IGNORE INTO employees (id, user_id, name, role, department_id, employee_code, salary) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: e
        });
    }

    // Default Leave Balances
    const currentYear = new Date().getFullYear();
    for(let i=1; i<=3; i++) {
        await db.execute({
            sql: `INSERT OR IGNORE INTO leave_balances (user_id, total_leaves, used_leaves, remaining_leaves, year) VALUES (?, 18, 0, 18, ?)`,
            args: [i, currentYear]
        });
    }

    console.log('[DB] Master data synchronized.');

  } catch (error) {
    console.error('[CRITICAL] DB initialization error:', error.message);
  }
};

initDb();

module.exports = { db };
