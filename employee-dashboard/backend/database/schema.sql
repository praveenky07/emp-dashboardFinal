-- schema.sql
-- Drop tables if they exist for clean initialization (optional, remove in prod)
DROP TABLE IF EXISTS bonuses;
DROP TABLE IF EXISTS leaves;
DROP TABLE IF EXISTS breaks;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS admins;

CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Employee', -- 'Employee', 'Manager', 'Admin'
    department TEXT NOT NULL,
    salary REAL NOT NULL,
    joining_date DATE NOT NULL
);

CREATE TABLE meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    meeting_date DATETIME NOT NULL,
    duration INTEGER, -- in minutes
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    check_in DATETIME NOT NULL,
    check_out DATETIME,
    work_hours REAL,
    date DATE NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE breaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    break_start DATETIME NOT NULL,
    break_end DATETIME,
    break_duration REAL,
    date DATE NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE bonuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    bonus_amount REAL NOT NULL,
    bonus_reason TEXT,
    date_given DATE NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Insert default admin (password is 'admin123' hashed)
-- bcrypt hash for 'admin123'
INSERT INTO admins (username, password) VALUES ('admin', '$2b$10$h7ywuuV4xpPqKrXzeNJMlOeTYoI1wvbey8m1puXE7EDliWcvdHbRG');
