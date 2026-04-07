const { db } = require('../db/db');
const { logActivity } = require('../db/logs');
const { getIo } = require('../socket');
const { emitLeaveRequested, emitLeaveApproved, emitLeaveRejected } = require('../socket/events');

exports.applyLeave = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { startDate, endDate, reason, type = 'Casual' } = req.body;
  const currentYear = new Date().getFullYear();

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const requestedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (requestedDays <= 0) return res.status(400).json({ error: 'Invalid leave duration' });

    // Fetch current balance for the current year
    const balanceResult = await db.execute({
        sql: `SELECT remaining_leaves FROM leave_balances WHERE user_id = ? AND year = ?`,
        args: [userId, currentYear]
    });

    const remaining = balanceResult.rows[0]?.remaining_leaves || 0;
    if (remaining < requestedDays) {
        return res.status(400).json({ error: `You only have ${remaining} days remaining. This request requires ${requestedDays} days.` });
    }

    const userResult = await db.execute({
      sql: 'SELECT manager_id FROM users WHERE id = ?',
      args: [userId]
    });
    let managerId = userResult.rows[0]?.manager_id;
    
    if (!managerId && (role === 'manager' || role === 'hr')) {
       const adminResult = await db.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
       managerId = adminResult.rows[0]?.id || 1; 
    }

    const appliedTo = managerId || 1; 
    const initialStatus = role === 'admin' ? 'Approved' : 'Pending';

    // Insert leave record
    const result = await db.execute({
      sql: 'INSERT INTO leaves (user_id, appliedTo, manager_id, start_date, end_date, reason, status, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [userId, appliedTo, managerId, startDate, endDate, reason, initialStatus, type]
    });
    const requestId = result.lastInsertRowid?.toString();

    // If auto-approved, update balance and sync attendance
    if (initialStatus === 'Approved') {
        await db.execute({
            sql: `UPDATE leave_balances SET used_leaves = used_leaves + ?, remaining_leaves = remaining_leaves - ? WHERE user_id = ? AND year = ?`,
            args: [requestedDays, requestedDays, userId, currentYear]
        });

        // Sync with attendance
        const d = new Date(start);
        while (d <= end) {
            const dateStr = d.toISOString().split('T')[0];
            await db.execute({
              sql: "INSERT OR IGNORE INTO attendance (user_id, date, clock_in, clock_out, status) VALUES (?, ?, '00:00:00', '00:00:00', 'On Leave')",
              args: [userId, dateStr]
            });
            d.setDate(d.getDate() + 1);
        }
    }

    await logActivity(userId, 'apply_leave', { requestId, startDate, endDate, appliedTo, status: initialStatus, type });
    
    try {
        if (initialStatus === 'Approved') {
            emitLeaveApproved(getIo(), { userId, requestId });
        } else {
            emitLeaveRequested(getIo(), { userId, requestId });
        }
    } catch(e) { console.error('Socket error emitting leave event', e); }

    res.json({ 
        message: initialStatus === 'Approved' ? 'Leave approved and indexed' : 'Leave request submitted successfully', 
        requestId,
        daysRequested: requestedDays
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelLeave = async (req, res) => {
  const userId = req.user.id;
  const leaveId = req.params.id;
  try {
    const check = await db.execute({
      sql: "SELECT * FROM leaves WHERE id = ? AND user_id = ? AND status = 'Pending'",
      args: [leaveId, userId]
    });
    if (check.rows.length === 0) return res.status(400).json({ error: 'Pending leave request not found' });
    
    await db.execute({ sql: "UPDATE leaves SET status = 'Cancelled' WHERE id = ?", args: [leaveId] });
    await logActivity(userId, 'cancel_leave', { leaveId });
    
    try {
        emitLeaveRejected(getIo(), { userId, leaveId, action: 'cancel' });
    } catch(e) { console.error('Socket error emitting cancelLeave', e); }

    res.json({ message: 'Leave request cancelled' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getLeaves = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.execute({ sql: 'SELECT * FROM leaves WHERE user_id = ? ORDER BY created_at DESC', args: [userId] });
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAllPendingLeaves = async (req, res) => {
  const userId = req.user.id;
  const userRole = (req.user.role || '').toLowerCase();
  try {
    let sql = "SELECT l.*, u.name as user_name FROM leaves l JOIN users u ON l.user_id = u.id WHERE l.status = 'Pending'";
    let args = [];
    if (userRole !== 'admin') {
      sql += " AND l.appliedTo = ?";
      args.push(userId);
    }
    const result = await db.execute({ sql: sql + " ORDER BY created_at DESC", args });
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getTeamLeaves = async (req, res) => {
  const userId = req.user.id;
  const userRole = (req.user.role || '').toLowerCase();
  try {
    let sql = "SELECT l.*, u.name as user_name FROM leaves l JOIN users u ON l.user_id = u.id";
    let args = [];
    if (userRole !== 'admin') {
      sql += " WHERE l.appliedTo = ?";
      args.push(userId);
    }
    const result = await db.execute({ sql: sql + " ORDER BY created_at DESC", args });
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateLeaveStatus = async (req, res) => {
  const { id, status } = req.body;
  const loggedInUserId = req.user.id;
  const role = req.user.role;
  const currentYear = new Date().getFullYear();

  try {
    const leaveCheck = await db.execute({ sql: 'SELECT * FROM leaves WHERE id = ?', args: [id] });
    if (leaveCheck.rows.length === 0) return res.status(404).json({ error: 'Leave not found' });

    const leave = leaveCheck.rows[0];
    if (status === 'Approved' && leave.status === 'Pending') {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        const requestedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Balance Check
        const balanceResult = await db.execute({ 
            sql: `SELECT remaining_leaves FROM leave_balances WHERE user_id = ? AND year = ?`, 
            args: [leave.user_id, currentYear] 
        });
        const remaining = balanceResult.rows[0]?.remaining_leaves || 0;
        if (remaining < requestedDays) return res.status(400).json({ error: 'Employee has insufficient leave balance' });

        // Deduction
        await db.execute({
            sql: `UPDATE leave_balances SET used_leaves = used_leaves + ?, remaining_leaves = remaining_leaves - ? WHERE user_id = ? AND year = ?`,
            args: [requestedDays, requestedDays, leave.user_id, currentYear]
        });

        // Sync Attendance
        const d = new Date(start);
        while (d <= end) {
            const ds = d.toISOString().split('T')[0];
            await db.execute({
              sql: "INSERT OR REPLACE INTO attendance (user_id, date, clock_in, clock_out, status) VALUES (?, ?, ?, ?, ?)",
              args: [leave.user_id, ds, '00:00:00', '00:00:00', 'On Leave']
            });
            d.setDate(d.getDate() + 1);
        }
    }

    await db.execute({ sql: 'UPDATE leaves SET status = ? WHERE id = ?', args: [status, id] });
    await logActivity(loggedInUserId, 'update_leave_status', { requestId: id, status });
    
    try {
        if (status === 'Approved') emitLeaveApproved(getIo(), { leaveId: id, userId: leave.user_id });
        else if (status === 'Rejected') emitLeaveRejected(getIo(), { leaveId: id, userId: leave.user_id });
    } catch(e) { console.error('Socket error emitting updateLeaveStatus', e); }

    res.json({ message: `Leave ${status}`, id, status });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getLeaveBalances = async (req, res) => {
  const userId = req.user.id;
  const currentYear = new Date().getFullYear();
  try {
    const result = await db.execute({ sql: 'SELECT * FROM leave_balances WHERE user_id = ? AND year = ?', args: [userId, currentYear] });
    res.json(result.rows[0] || { total_leaves: 18, used_leaves: 0, remaining_leaves: 18, year: currentYear });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAllLeaveBalances = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const currentYear = new Date().getFullYear();
  try {
    let sql = `SELECT lb.*, u.name as user_name FROM leave_balances lb JOIN users u ON lb.user_id = u.id WHERE lb.year = ?`;
    let args = [currentYear];

    if (role !== 'admin') {
      sql += ` AND (u.manager_id = ? OR u.id = ?)`;
      args.push(userId, userId);
    }

    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

