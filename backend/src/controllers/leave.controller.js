const { db } = require('../db/db');
const { logActivity } = require('../db/logs');
const { getIo } = require('../socket');
const { emitLeaveRequested, emitLeaveApproved, emitLeaveRejected } = require('../socket/events');
const notificationService = require('../services/notification.service');

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

    // Fetch current balance
    const balanceResult = await db.execute({
        sql: `SELECT remaining_leaves FROM leave_balances WHERE user_id = ? AND year = ?`,
        args: [userId, currentYear]
    });

    const remaining = balanceResult.rows[0]?.remaining_leaves || 0;
    if (remaining < requestedDays) {
        return res.status(400).json({ error: `Insufficient balance. Available: ${remaining} days.` });
    }

    const userResult = await db.execute({
      sql: 'SELECT manager_id FROM users WHERE id = ?',
      args: [userId]
    });
    let managerId = userResult.rows[0]?.manager_id || 1; // Default to Admin
    
    const initialStatus = role === 'admin' ? 'Approved' : 'Pending';

    // Insert leave record (unified schema uses manager_id)
    const result = await db.execute({
      sql: 'INSERT INTO leaves (user_id, manager_id, start_date, end_date, reason, status, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [userId, managerId, startDate, endDate, reason, initialStatus, type]
    });
    const requestId = result.lastInsertRowid?.toString();

    // If auto-approved, update balance and sync attendance
    if (initialStatus === 'Approved') {
        await this.syncApprovedLeave(userId, startDate, endDate, requestedDays, currentYear);
    }

    await logActivity(userId, 'apply_leave', { requestId, startDate, endDate, managerId, status: initialStatus, type });
    
    try {
        if (initialStatus === 'Approved') {
            emitLeaveApproved(getIo(), { userId, requestId });
        } else {
            emitLeaveRequested(getIo(), { userId, requestId });
            await notificationService.createNotification(managerId, 'leave_request', `${req.user.name} has requested leave from ${startDate} to ${endDate}.`, { requestId, from: userId });
        }
    } catch(e) {}

    res.json({ 
        message: initialStatus === 'Approved' ? 'Leave auto-approved' : 'Leave request submitted', 
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
    const currentYear = new Date().getFullYear();
    try {
      const check = await db.execute({
        sql: "SELECT * FROM leaves WHERE id = ? AND user_id = ?",
        args: [leaveId, userId]
      });
      if (check.rows.length === 0) return res.status(404).json({ error: 'Leave request not found' });
      
      const leave = check.rows[0];
      if (leave.status === 'Cancelled') return res.status(400).json({ error: 'Already cancelled' });

      // If it was approved, we MUST refund the balance
      if (leave.status === 'Approved') {
          const start = new Date(leave.start_date);
          const end = new Date(leave.end_date);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          await this.syncRevokedLeave(userId, leave.start_date, leave.end_date, days, currentYear);
      }

      await db.execute({ sql: "UPDATE leaves SET status = 'Cancelled' WHERE id = ?", args: [leaveId] });
      await logActivity(userId, 'cancel_leave', { leaveId });
      
      try { emitLeaveRejected(getIo(), { userId, leaveId, action: 'cancel' }); } catch(e) {}
  
      res.json({ message: 'Leave request cancelled' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// Centralized helper for approving leave logic
exports.syncApprovedLeave = async (userId, startDate, endDate, days, year) => {
    await db.execute({
        sql: `UPDATE leave_balances SET used_leaves = used_leaves + ?, remaining_leaves = remaining_leaves - ? WHERE user_id = ? AND year = ?`,
        args: [days, days, userId, year]
    });

    const d = new Date(startDate);
    const end = new Date(endDate);
    while (d <= end) {
        const dateStr = d.toISOString().split('T')[0];
        await db.execute({
          sql: "INSERT OR REPLACE INTO attendance (user_id, date, clock_in, clock_out, status) VALUES (?, ?, '00:00:00', '00:00:00', 'On Leave')",
          args: [userId, dateStr]
        });
        d.setDate(d.getDate() + 1);
    }
};

exports.syncRevokedLeave = async (userId, startDate, endDate, days, year) => {
    await db.execute({
        sql: `UPDATE leave_balances SET used_leaves = used_leaves - ?, remaining_leaves = remaining_leaves + ? WHERE user_id = ? AND year = ?`,
        args: [days, days, userId, year]
    });

    const d = new Date(startDate);
    const end = new Date(endDate);
    while (d <= end) {
        const dateStr = d.toISOString().split('T')[0];
        await db.execute({
          sql: "DELETE FROM attendance WHERE user_id = ? AND date = ? AND status = 'On Leave'",
          args: [userId, dateStr]
        });
        d.setDate(d.getDate() + 1);
    }
};

exports.updateLeaveStatus = async (req, res) => {
  const { id, status } = req.body;
  const loggedInUserId = req.user.id;
  const role = req.user.role;
  const currentYear = new Date().getFullYear();

  try {
    const leaveCheck = await db.execute({ sql: 'SELECT * FROM leaves WHERE id = ?', args: [id] });
    if (leaveCheck.rows.length === 0) return res.status(404).json({ error: 'Leave record not found' });

    const leave = leaveCheck.rows[0];
    const prevStatus = leave.status;
    
    // Auth Check
    const isManager = Number(leave.manager_id) === Number(loggedInUserId);
    const isAdmin = role?.toLowerCase() === 'admin';
    
    if (!isManager && !isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Transition Logic: PENDING -> APPROVED
    if (status === 'Approved' && prevStatus === 'Pending') {
        await this.syncApprovedLeave(leave.user_id, leave.start_date, leave.end_date, days, currentYear);
    } 
    // Transition Logic: APPROVED -> REJECTED/CANCELLED (Refund)
    else if (prevStatus === 'Approved' && (status === 'Rejected' || status === 'Cancelled')) {
        await this.syncRevokedLeave(leave.user_id, leave.start_date, leave.end_date, days, currentYear);
    }

    await db.execute({ sql: 'UPDATE leaves SET status = ? WHERE id = ?', args: [status, id] });
    
    try {
        if (status === 'Approved') {
            await notificationService.createNotification(leave.user_id, 'leave', `Your leave (${leave.start_date}) is approved.`, { requestId: id });
        } else if (status === 'Rejected') {
            await notificationService.createNotification(leave.user_id, 'leave', `Your leave (${leave.start_date}) was rejected.`, { requestId: id });
        }
    } catch(e) {}

    res.json({ message: `Leave ${status}`, id, status });
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
  const role = req.user.role?.toLowerCase();
  try {
    let sql = "SELECT l.*, u.name as user_name FROM leaves l JOIN users u ON l.user_id = u.id WHERE l.status = 'Pending'";
    let args = [];
    if (role !== 'admin') {
      sql += " AND l.manager_id = ?";
      args.push(userId);
    }
    const result = await db.execute({ sql: sql + " ORDER BY l.created_at DESC", args });
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getTeamLeaves = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role?.toLowerCase();
    try {
      let sql = "SELECT l.*, u.name as user_name FROM leaves l JOIN users u ON l.user_id = u.id";
      let args = [];
      if (role !== 'admin') {
        sql += " WHERE l.manager_id = ? OR l.user_id = ?";
        args.push(userId, userId);
      }
      const result = await db.execute({ sql: sql + " ORDER BY l.created_at DESC", args });
      res.json(result.rows);
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
