const { db } = require('../db/db');
const { getLogs } = require('../db/logs');
const { getIo } = require('../socket');
const { emitUserDeleted, emitStatsUpdated } = require('../socket/events');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT u.id, u.name, u.email, u.role, u.created_at, u.manager_id, 
             m.name as manager_name, d.name AS department_name, 
             e.salary, e.employee_code, e.department_id
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmployeeDetails = async (req, res) => {
    const { id, name, role, email, department_id, salary, manager_id } = req.body;
    const adminId = req.user.id;
    const finalManagerId = manager_id === '' || manager_id === undefined ? null : manager_id;
    try {
        // Check old salary for history
        const oldResult = await db.execute({
            sql: 'SELECT salary FROM employees WHERE user_id = ?',
            args: [id]
        });
        const oldSalary = oldResult.rows[0]?.salary || 0;

        await db.execute({
            sql: 'UPDATE users SET name = ?, role = ?, email = ?, manager_id = ? WHERE id = ?',
            args: [name, role, email, finalManagerId, id]
        });
        await db.execute({
            sql: 'UPDATE employees SET name = ?, role = ?, department_id = ?, salary = ? WHERE user_id = ?',
            args: [name, role, department_id, salary, id]
        });

        if (Number(salary) !== Number(oldSalary)) {
            await db.execute({
                sql: 'INSERT INTO salary_history (user_id, old_salary, new_salary, updated_by) VALUES (?, ?, ?, ?)',
                args: [id, oldSalary, salary, adminId]
            });
        }

        const clientIp = req.ip || req.headers['x-forwarded-for'];
        const clientUa = req.headers['user-agent'];
        await logActivity(adminId, 'update_employee_details', { targetUserId: id, name, role, salary }, clientIp, clientUa);

        try {
            emitStatsUpdated(getIo(), { message: 'Employee updated', employeeId: id });
        } catch(e) {}

        res.json({ message: 'Employee details updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

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
    
    const clientIp = req.ip || req.headers['x-forwarded-for'];
    const clientUa = req.headers['user-agent'];
    await logActivity(req.user.id, 'delete_user', { targetUserId: id }, clientIp, clientUa);
    
    try {
        emitUserDeleted(getIo(), { userId: id });
        emitStatsUpdated(getIo(), { message: 'User deleted via admin' });
    } catch(e) {}

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSalaryHistory = async (req, res) => {
    const { userId } = req.query;
    try {
        let sql = `
            SELECT sh.*, u.name as employee_name, ub.name as updated_by_name
            FROM salary_history sh
            JOIN users u ON sh.user_id = u.id
            JOIN users ub ON sh.updated_by = ub.id
        `;
        let args = [];
        if (userId) {
            sql += ' WHERE sh.user_id = ?';
            args.push(userId);
        }
        sql += ' ORDER BY sh.updated_at DESC';
        
        const result = await db.execute({ sql, args });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

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
    const result = await db.execute(`
        SELECT d.name as role, AVG(u.productivity_score) as avg_work_duration 
        FROM departments d
        LEFT JOIN employees e ON d.id = e.department_id
        LEFT JOIN users u ON e.user_id = u.id
        GROUP BY d.name
    `);

    res.json(result.rows);
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
            SELECT u.id, u.name, u.role, a.clock_in as start_time, d.name as department_name
            FROM users u 
            JOIN attendance a ON u.id = a.user_id 
            LEFT JOIN employees e ON u.id = e.user_id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE a.clock_out IS NULL
        `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getAdminStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [u, s, pl, sm, d, al] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM users'),
      db.execute({
          sql: 'SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE clock_out IS NULL AND date = ?',
          args: [today]
      }),
      db.execute("SELECT COUNT(*) as count FROM leaves WHERE status = 'Pending'"),
      db.execute({
          sql: "SELECT COUNT(*) as count FROM meetings WHERE scheduled_at LIKE ?",
          args: [`${today}%`]
      }),
      db.execute('SELECT COUNT(*) as count FROM departments'),
      db.execute("SELECT COUNT(*) as count FROM leaves WHERE status = 'Approved'")
    ]);

    res.json({
      totalUsers: u.rows[0].count,
      activeSessions: s.rows[0].count,
      pendingLeaves: pl.rows[0].count,
      scheduledMeetings: sm.rows[0].count,
      totalDepartments: d.rows[0].count,
      approvedLeaves: al.rows[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT l.*, u.name as user_name 
      FROM leaves l 
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllMeetings = async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT m.*, u.name as organizer 
      FROM meetings m 
      JOIN users u ON m.created_by = u.id
      ORDER BY m.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

