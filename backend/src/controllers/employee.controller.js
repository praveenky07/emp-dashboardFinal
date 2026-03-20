const db = require('../db/db');

// Add Employee
exports.addEmployee = async (req, res) => {
  const { name, role, department } = req.body;
  try {
    const result = await db.execute({
      sql: 'INSERT INTO employees (name, role, department) VALUES (?, ?, ?)',
      args: [name, role, department]
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
    const result = await db.execute('SELECT * FROM employees');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark Attendance
exports.markAttendance = async (req, res) => {
  const { employeeId, date, status } = req.body;
  try {
    const result = await db.execute({
      sql: 'INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)',
      args: [employeeId, date, status || 'Present']
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
  const { employeeId } = req.params;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC',
      args: [employeeId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
