const { db } = require('../db/db');

exports.getTeamMembers = async (req, res) => {
  const managerId = req.user.id;
  try {
    const result = await db.execute({
      sql: `SELECT u.id, u.name, u.email, u.role, u.productivity_score, d.name as department 
            FROM users u 
            LEFT JOIN employees e ON u.id = e.user_id 
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE u.manager_id = ?`,
      args: [managerId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingLeaves = async (req, res) => {
  const managerId = req.user.id;
  try {
    const result = await db.execute({
      sql: `SELECT l.*, u.name as user_name 
            FROM leaves l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.manager_id = ? AND l.status = 'Pending' 
            ORDER BY l.created_at DESC`,
      args: [managerId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getManagerStats = async (req, res) => {
  const managerId = req.user.id;
  try {
    // 1. Direct reports count
    const teamRes = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM users WHERE manager_id = ?',
      args: [managerId]
    });
    const directReports = teamRes.rows[0].count;

    // 2. Pending Actions (Tasks)
    const taskRes = await db.execute({
      sql: "SELECT COUNT(*) as count FROM tasks WHERE assigned_by = ? AND LOWER(status) = 'pending'",
      args: [managerId]
    });
    let pendingActions = taskRes.rows[0].count;

    // Fallback to leaves pending if tasks are not used immediately
    if (pendingActions === 0) {
      const leaveRes = await db.execute({
        sql: "SELECT COUNT(*) as count FROM leaves WHERE manager_id = ? AND status = 'Pending'",
        args: [managerId]
      });
      pendingActions = leaveRes.rows[0].count;
    }

    // 3. Availability (Working Days - Present Days)
    const workingDaysRes = await db.execute({
      sql: "SELECT COUNT(*) as count FROM attendance a JOIN users u ON a.user_id = u.id WHERE u.manager_id = ? AND a.status = 'Present'",
      args: [managerId]
    });
    const presentDays = workingDaysRes.rows[0].count || 0;
    const assumedWorkingDays = 22 * Math.max(1, directReports);
    const availability = Math.max(0, assumedWorkingDays - presentDays); 

    // 4. Team Syncs
    const meetRes = await db.execute({
      sql: "SELECT COUNT(*) as count FROM meetings WHERE created_by = ?",
      args: [managerId]
    });
    const teamSyncs = meetRes.rows[0].count;

    res.json({
      directReports,
      pendingActions,
      availability,
      teamSyncs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
