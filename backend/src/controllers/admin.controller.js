const db = require('../db/db');
const { getLogs } = require('../db/logs');
const fs = require('fs');
const path = require('path');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.execute('SELECT id, name, email, role, created_at FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  const { id, role } = req.body;
  try {
    await db.execute({
      sql: 'UPDATE users SET role = ? WHERE id = ?',
      args: [role, id]
    });
    res.json({ message: 'User role updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id]
    });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSystemSettings = async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM system_settings');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSetting = async (req, res) => {
  const { key, value } = req.body;
  try {
    await db.execute({
      sql: 'INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)',
      args: [key, value]
    });
    res.json({ message: 'Setting updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPerformanceMetrics = async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT u.role, AVG(ws.total_duration) as avg_work_duration
      FROM users u
      LEFT JOIN work_sessions ws ON u.id = ws.user_id
      GROUP BY u.role
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.backupDatabase = (req, res) => {
  // Backup logic for Turso cloud is different, usually managed via Turso CLI or dashboard.
  res.status(501).json({ message: 'Backup feature is now managed via Turso Dashboard' });
};

exports.getActiveSessions = async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT u.id, u.name, u.role, ws.start_time 
            FROM users u 
            JOIN work_sessions ws ON u.id = ws.user_id 
            WHERE ws.end_time IS NULL
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
