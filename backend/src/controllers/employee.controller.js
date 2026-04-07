const { db } = require('../db/db');

// Add Employee
exports.addEmployee = async (req, res) => {
  const { name, role, department_id, user_id } = req.body;
  try {
    const result = await db.execute({
      sql: 'INSERT INTO employees (user_id, name, role, department_id) VALUES (?, ?, ?, ?)',
      args: [user_id, name, role, department_id]
    });
    res.status(201).json({ 
      message: 'Employee added successfully', 
      id: result.lastInsertRowid?.toString() 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Employees
exports.getEmployees = async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT e.*, d.name AS department_name
      FROM employees e
      JOIN departments d ON e.department_id = d.id
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark Attendance (Historical/Admin usage)
exports.markAttendance = async (req, res) => {
  const { userId, loginTime, logoutTime } = req.body;
  try {
    const result = await db.execute({
      sql: 'INSERT INTO attendance (user_id, login_time, logout_time) VALUES (?, ?, ?)',
      args: [userId, loginTime, logoutTime]
    });
    res.status(201).json({ 
      message: 'Attendance marked', 
      id: result.lastInsertRowid?.toString() 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Attendance for employee
exports.getAttendance = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM attendance WHERE user_id = ? ORDER BY login_time DESC',
      args: [userId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

