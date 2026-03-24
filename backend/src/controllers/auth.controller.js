const db = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Trim and Lowercase email for consistency
  email = email.trim().toLowerCase();
  console.log(`[DEBUG] Login attempt for: ${email}`);

  try {
    const result = await db.execute({
      sql: `
        SELECT u.id, u.name, u.email, u.password, u.role, u.created_at, d.name as department_name, e.employee_code
        FROM users u 
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE LOWER(u.email) = ?
      `,
      args: [email]
    });


    const user = result.rows[0];
    if (!user) {
      console.log(`[DEBUG] No user found with email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`[DEBUG] User found. Stored Role: ${user.role}`);

    const passwordMatch = bcrypt.compareSync(password, user.password);
    console.log(`[DEBUG] Password match result: ${passwordMatch}`);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('[DEBUG] Token Payload:', { id: user.id, role: user.role.toLowerCase(), name: user.name });

    const token = jwt.sign(
      { id: user.id, role: user.role.toLowerCase(), name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log('[DEBUG] Generated Token (prefix):', token.substring(0, 10));

    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role.toLowerCase(), 
        department: user.department_name,
        employee_id: user.employee_code
      }
    });

  } catch (error) {
    console.error('[DEBUG] Login error detail:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }

};

exports.register = async (req, res) => {
  const { name, email, password, role, department_id } = req.body;
  if (!name || !email || !password || !department_id) {
    return res.status(400).json({ message: 'Name, email, password and department are required' });
  }

  try {
    // Verify department exists
    const deptResult = await db.execute({
      sql: 'SELECT id FROM departments WHERE id = ?',
      args: [department_id]
    });
    
    if (deptResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      args: [name, email.toLowerCase().trim(), passwordHash, (role || 'employee').toLowerCase()]
    });
    const userId = result.lastInsertRowid;

    // Generate Employee ID (EMP001, EMP002...)
    const countResult = await db.execute('SELECT COUNT(*) as count FROM employees');
    const nextId = (countResult.rows[0].count + 1).toString().padStart(3, '0');
    const employeeCode = `EMP${nextId}`;

    // Insert into employees table
    await db.execute({
      sql: `INSERT INTO employees (user_id, name, role, department_id, employee_code) VALUES (?, ?, ?, ?, ?)`,
      args: [userId, name, role || 'employee', department_id, employeeCode]
    });

    res.status(201).json({
      message: 'User created successfully',
      id: userId?.toString()
    });

  } catch (error) {
    console.error('Registration error detail:', error);
    res.status(400).json({ message: error.message });
  }
};

