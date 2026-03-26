const { db } = require('../db/db');
const { logActivity } = require('../db/logs');

exports.applyLeave = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { startDate, endDate, reason } = req.body;
  try {
    const userResult = await db.execute({
      sql: 'SELECT manager_id FROM users WHERE id = ?',
      args: [userId]
    });
    let managerId = userResult.rows[0]?.manager_id;
    
    // Find a default Admin (role='admin') if managerId is missing for managers
    if (!managerId && (role === 'manager' || role === 'hr')) {
       const adminResult = await db.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
       managerId = adminResult.rows[0]?.id || 1; 
    }

    const appliedTo = managerId || 1; 

    // DEBUG LOGS (Mandatory)
    console.log(`[LEAVE_FLOW] Applying Leave: userId=${userId}, role=${role}, appliedTo=${appliedTo}, managerId=${managerId || 'NULL'}`);

    const initialStatus = role === 'admin' ? 'Approved' : 'Pending';

    const result = await db.execute({
      sql: 'INSERT INTO leaves (user_id, appliedTo, manager_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [userId, appliedTo, managerId, startDate, endDate, reason, initialStatus]
    });
    const requestId = result.lastInsertRowid?.toString();
    await logActivity(userId, 'apply_leave', { requestId, startDate, endDate, appliedTo, status: initialStatus });
    res.json({ message: role === 'admin' ? 'Leave approved automatically' : 'Leave application submitted', requestId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelLeave = async (req, res) => {
  const userId = req.user.id;
  const leaveId = req.params.id;
  try {
    const check = await db.execute({
      sql: 'SELECT * FROM leaves WHERE id = ? AND user_id = ? AND status = ?',
      args: [leaveId, userId, 'Pending']
    });
    if (check.rows.length === 0) {
      return res.status(400).json({ error: 'Leave request not found or cannot be cancelled' });
    }
    await db.execute({
      sql: "UPDATE leaves SET status = 'Cancelled' WHERE id = ?",
      args: [leaveId]
    });
    await logActivity(userId, 'cancel_leave', { leaveId });
    res.json({ message: 'Leave application cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaves = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM leaves WHERE user_id = ? ORDER BY created_at DESC',
      args: [userId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPendingLeaves = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  try {
    let sql = "SELECT l.*, u.name as user_name FROM leaves l JOIN users u ON l.user_id = u.id WHERE l.status = 'Pending'";
    let args = [];
    
    // Filter by who the request is applied to
    if (role === 'manager' || role === 'admin' || role === 'hr') {
      sql += " AND l.appliedTo = ?";
      args.push(userId);
    }
    
    sql += " ORDER BY created_at DESC";
    
    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTeamLeaves = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  try {
    let sql = "SELECT l.*, u.name as user_name FROM leaves l JOIN users u ON l.user_id = u.id";
    let args = [];
    
    // Filter by management scope
    if (role === 'manager' || role === 'admin' || role === 'hr') {
      sql += " WHERE l.appliedTo = ?";
      args.push(userId);
    }
    
    sql += " ORDER BY created_at DESC";
    
    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  const { id, status } = req.body;
  const loggedInUserId = Number(req.user.id);
  const role = req.user.role;

  // 1. FORCE DEBUG LOGS (Mandatory)
  console.log(`[LEAVE_UPDATE_START] Request: id=${id}, status=${status}, user=${loggedInUserId}, role=${role}`);

  if (!id || !status) {
    return res.status(400).json({ error: 'Missing id or status in request body' });
  }

  try {
    // 2. Fetch leave from DB
    const leaveCheck = await db.execute({
      sql: 'SELECT * FROM leaves WHERE id = ?',
      args: [id]
    });

    if (leaveCheck.rows.length === 0) {
      console.log(`[LEAVE_UPDATE_FAIL] No record found with ID ${id}`);
      return res.status(404).json({ error: `No leave record found with ID ${id}` });
    }

    const leave = leaveCheck.rows[0];
    const appliedTo = Number(leave.appliedTo);

    // 3. Check permission (Strict Number Comparison)
    const isAuthorized = appliedTo === loggedInUserId || role === 'admin';
    
    console.log(`[LEAVE_AUTH_CHECK] id=${id}, user=${loggedInUserId}, appliedTo=${appliedTo}, isAuthorized=${isAuthorized}`);

    if (!isAuthorized) {
      console.error(`[LEAVE_AUTH_FAIL] Blocked: User ${loggedInUserId} (role: ${role}) tried to update leave ${id} owned by ${appliedTo}`);
      return res.status(403).json({ error: 'Unauthorized: You are not the assigned manager for this leave request' });
    }

    // 4. Update Database
    const result = await db.execute({
      sql: 'UPDATE leaves SET status = ? WHERE id = ?',
      args: [status, id]
    });
    
    // 5. Verify persistence
    if (result.rowsAffected === 0) {
      console.error("[LEAVE_UPDATE_ERR] DB Error: Update returned 0 rows affected.");
      return res.status(500).json({ error: 'Database update failed' });
    }

    console.log(`[LEAVE_UPDATE_SUCCESS] id=${id} set to ${status} by user ${loggedInUserId}`);

    await logActivity(loggedInUserId, 'update_leave_status', { requestId: id, status });
    res.json({ message: `Leave application ${status} successfully`, id, status });
  } catch (error) {
    // 6. Detailed Error Recovery
    console.error(`[LEAVE_UPDATE_CRIT] ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaveBalances = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM leave_balances WHERE user_id = ?',
      args: [userId]
    });
    res.json(result.rows[0] || { sick_leave: 0, casual_leave: 0, earned_leave: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
