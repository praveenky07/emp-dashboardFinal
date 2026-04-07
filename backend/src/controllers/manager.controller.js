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
