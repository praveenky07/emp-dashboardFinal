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
      sql: 'SELECT * FROM users WHERE LOWER(email) = ?',
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

    const token = jwt.sign(
      { id: user.id, role: user.role.toLowerCase(), name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role.toLowerCase() }
    });
  } catch (error) {
    console.error('[DEBUG] Login error detail:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      args: [name, email.toLowerCase().trim(), passwordHash, (role || 'employee').toLowerCase()]
    });
    
    res.status(201).json({ 
      message: 'User created successfully', 
      id: result.lastInsertRowid?.toString() 
    });
  } catch (error) {
    console.error('Registration error detail:', error);
    res.status(400).json({ message: error.message });
  }
};
