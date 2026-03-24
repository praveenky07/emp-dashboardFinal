const db = require('../db/db');
const { getLogs } = require('../db/logs');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT u.id, u.name, u.email, u.role, u.created_at, d.name AS department_name
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.id
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateUserRole = async (req, res) => {
  const { id, role } = req.body;
  try {
    await db.execute({
      sql: 'UPDATE users SET role = ? WHERE id = ?',
      args: [role, id]
    });
    // Also update employees table if exists
    await db.execute({
        sql: 'UPDATE employees SET role = ? WHERE user_id = ?',
        args: [role, id]
    });
    res.json({ message: 'User role updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({ sql: 'DELETE FROM employees WHERE user_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM attendance WHERE user_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM breaks WHERE user_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM meetings WHERE user_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM leaves WHERE user_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSystemSettings = async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM system_settings');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPerformanceMetrics = async (req, res) => {
  try {
    const users = await db.execute(`
      SELECT u.id, d.name AS department_name 
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.id
    `);
    const attendance = await db.execute("SELECT user_id, login_time, logout_time FROM attendance");
    
    // Group by department
    const deptStats = {};
    users.rows.forEach(u => {
        const dept = u.department_name || 'Unassigned';
        if (!deptStats[dept]) deptStats[dept] = { total_work: 0, count: 0 };
    });

    attendance.rows.forEach(a => {
        const user = users.rows.find(u => u.id === a.user_id);
        if (user) {
            const dept = user.department_name || 'Unassigned';
            const start = new Date(a.login_time);
            const end = a.logout_time ? new Date(a.logout_time) : new Date();
            const dur = Math.floor((end - start) / 1000);
            deptStats[dept].total_work += dur;
            deptStats[dept].count += 1;
        }
    });

    const result = Object.keys(deptStats).map(dept => ({
        role: dept, // Keep property name 'role' for frontend compatibility if needed, though 'department' is better
        avg_work_duration: deptStats[dept].count > 0 ? (deptStats[dept].total_work / deptStats[dept].count) : 0
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.backupDatabase = (req, res) => {
  res.status(501).json({ message: 'Backup feature is now managed via Turso Dashboard' });
};

exports.getActiveSessions = async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT u.id, u.name, u.role, a.login_time as start_time, d.name as department_name
            FROM users u 
            JOIN attendance a ON u.id = a.user_id 
            LEFT JOIN employees e ON u.id = e.user_id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE a.logout_time IS NULL
        `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
