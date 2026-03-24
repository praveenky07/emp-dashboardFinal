const db = require('../db/db');
const { logActivity } = require('../db/logs');

exports.applyLeave = async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, reason } = req.body;
  try {
    const result = await db.execute({
      sql: 'INSERT INTO leave_requests (employee_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?)',
      args: [userId, startDate, endDate, reason, 'Pending']
    });
    const requestId = result.lastInsertRowid?.toString();
    await logActivity(userId, 'apply_leave', { requestId, startDate, endDate });
    res.json({ message: 'Leave application submitted', requestId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaves = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC',
      args: [userId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPendingLeaves = async (req, res) => {
  // For managers/admins
  try {
    const result = await db.execute("SELECT l.*, u.name as user_name FROM leave_requests l JOIN users u ON l.employee_id = u.id WHERE l.status = 'Pending' ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTeamLeaves = async (req, res) => {
  // For managers (all leave history for their department/team)
  try {
    const result = await db.execute("SELECT l.*, u.name as user_name FROM leave_requests l JOIN users u ON l.employee_id = u.id ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  const { id, status } = req.body; // status: Approved / Rejected
  const userId = req.user.id;
  try {
    await db.execute({
      sql: 'UPDATE leave_requests SET status = ? WHERE id = ?',
      args: [status, id]
    });
    await logActivity(userId, 'update_leave_status', { requestId: id, status });
    res.json({ message: `Leave application ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
