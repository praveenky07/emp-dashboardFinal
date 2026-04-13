const { db } = require('../db/db');
const { logActivity } = require('../db/logs');
const { getIo } = require('../socket');
const { emitLeaveRequested, emitLeaveApproved, emitLeaveRejected } = require('../socket/events');
const notificationService = require('../services/notification.service');

// Helper to calculate working days excluding weekends and holidays
const calculateWorkingDays = async (startDate, endDate, isHalfDay = false) => {
    if (isHalfDay) return 0.5;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Fetch holidays
    const holidayRes = await db.execute("SELECT date FROM holidays");
    const holidays = holidayRes.rows.map(h => h.date);

    let count = 0;
    const current = new Date(start);
    while (current <= end) {
        const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
        const dateString = current.toISOString().split('T')[0];
        
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidays.includes(dateString);

        if (!isWeekend && !isHoliday) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

exports.applyLeave = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role?.toLowerCase();
  const { startDate, endDate, reason, type = 'Casual', isHalfDay = false } = req.body;
  const currentYear = new Date().getFullYear();

  try {
    const requestedDays = await calculateWorkingDays(startDate, endDate, isHalfDay);

    if (requestedDays <= 0) {
        return res.status(400).json({ error: 'The selected range contains no working days (Weekends/Holidays).' });
    }

    // STRENGTHENED: Overlap Check
    const overlapCheck = await db.execute({
        sql: `SELECT id FROM leaves WHERE user_id = ? AND status NOT IN ('Rejected', 'Cancelled') AND (
               (start_date <= ? AND end_date >= ?) OR 
               (start_date <= ? AND end_date >= ?) OR
               (? <= start_date AND ? >= end_date)
             )`,
        args: [userId, startDate, startDate, endDate, endDate, startDate, endDate]
    });
    if (overlapCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Conflict Detected: You already have a leave request overlapping these dates.' });
    }

    // Ensure balance exists
    const balanceCheck = await db.execute({
        sql: `SELECT * FROM leave_balances WHERE user_id = ? AND year = ?`,
        args: [userId, currentYear]
    });

    if (balanceCheck.rows.length === 0) {
        await db.execute({
            sql: `INSERT INTO leave_balances (user_id, year, total_leaves, used_leaves, remaining_leaves) VALUES (?, ?, 18, 0, 18)`,
            args: [userId, currentYear]
        });
    }

    const remaining = balanceCheck.rows[0]?.remaining_leaves || 18;
    
    if (type !== 'Unpaid' && remaining < requestedDays) {
        return res.status(400).json({ error: `Insufficient balance for ${type} leave. Available: ${remaining} days. Apply for 'Unpaid' (LOP) leave if needed.` });
    }

    const userResult = await db.execute({
      sql: 'SELECT manager_id, name FROM users WHERE id = ?',
      args: [userId]
    });
    const managerId = userResult.rows[0]?.manager_id || 1;
    
    const initialStatus = role === 'admin' ? 'Approved' : 'Pending';

    const result = await db.execute({
      sql: 'INSERT INTO leaves (user_id, manager_id, start_date, end_date, reason, status, type, total_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [userId, managerId, startDate, endDate, reason, initialStatus, type, requestedDays]
    });
    const requestId = result.lastInsertRowid?.toString();

    if (initialStatus === 'Approved') {
        await this.syncApprovedLeave(userId, startDate, endDate, requestedDays, currentYear, type);
    }

    await logActivity(userId, 'apply_leave', { requestId, startDate, endDate, requestedDays, type });
    
    try {
        if (initialStatus === 'Approved') {
            getIo().to(`user_${userId}`).emit('leaveApproved', { requestId });
        } else {
            const io = getIo();
            io.to(`user_${managerId}`).emit('leaveRequested', { userId, requestId, userName: userResult.rows[0].name });
            await notificationService.createNotification(managerId, 'leave_request', `${req.user.name} requested ${requestedDays} days leave.`, { requestId, from: userId });
        }
    } catch(e) {}

    res.json({ message: 'Leave action processed', requestId, days: requestedDays });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.syncApprovedLeave = async (userId, startDate, endDate, days, year, type) => {
    if (type !== 'Unpaid') {
        await db.execute({
            sql: `UPDATE leave_balances SET used_leaves = used_leaves + ?, remaining_leaves = remaining_leaves - ? WHERE user_id = ? AND year = ?`,
            args: [days, days, userId, year]
        });
    }

    const d = new Date(startDate);
    const end = new Date(endDate);
    while (d <= end) {
        const dateStr = d.toISOString().split('T')[0];
        const day = d.getDay();
        if (day !== 0 && day !== 6) {
             await db.execute({
                sql: "INSERT OR REPLACE INTO attendance (user_id, date, status, clock_in, clock_out) VALUES (?, ?, ?, '00:00:00', '00:00:00')",
                args: [userId, dateStr, 'leave']
            });
        }
        d.setDate(d.getDate() + 1);
    }
};

exports.updateLeaveStatus = async (req, res) => {
  const { id, status } = req.body;
  const currentYear = new Date().getFullYear();

  try {
    const leaveCheck = await db.execute({ sql: 'SELECT * FROM leaves WHERE id = ?', args: [id] });
    if (leaveCheck.rows.length === 0) return res.status(404).json({ error: 'Leave record not found' });

    const leave = leaveCheck.rows[0];
    if (leave.status === status) return res.json({ message: 'Status already updated' });

    if (status === 'Approved') {
        await this.syncApprovedLeave(leave.user_id, leave.start_date, leave.end_date, leave.total_days, currentYear, leave.type);
    }

    await db.execute({ sql: 'UPDATE leaves SET status = ? WHERE id = ?', args: [status, id] });
    
    try {
        const io = getIo();
        io.to(`user_${leave.user_id}`).emit('leaveStatusUpdated', { id, status });
        await notificationService.createNotification(leave.user_id, 'leave', `Your leave for ${leave.start_date} has been ${status}.`, { requestId: id });
    } catch(e) {}

    res.json({ message: `Leave ${status}`, id });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getLeaves = async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM leaves WHERE user_id = ? ORDER BY created_at DESC', args: [req.user.id] });
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getLeaveBalances = async (req, res) => {
  const currentYear = new Date().getFullYear();
  try {
    const result = await db.execute({ sql: 'SELECT * FROM leave_balances WHERE user_id = ? AND year = ?', args: [req.user.id, currentYear] });
    res.json(result.rows[0] || { total_leaves: 18, used_leaves: 0, remaining_leaves: 18 });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getTeamLeaves = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role?.toLowerCase();
    try {
      let sql = "SELECT l.*, u.name as user_name FROM leaves l JOIN users u ON l.user_id = u.id";
      let args = [];
      if (role !== 'admin' && role !== 'hr') {
        sql += " WHERE u.manager_id = ?";
        args.push(userId);
      }
      const result = await db.execute({ sql: sql + " ORDER BY l.created_at DESC", args });
      res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.cancelLeave = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute({
            sql: "UPDATE leaves SET status = 'Cancelled' WHERE id = ? AND user_id = ? AND status = 'Pending'",
            args: [id, req.user.id]
        });
        res.json({ message: 'Leave request cancelled' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAllLeaveBalances = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role?.toLowerCase();
    const currentYear = new Date().getFullYear();
    try {
      let sql = `SELECT lb.*, u.name as user_name FROM leave_balances lb JOIN users u ON lb.user_id = u.id WHERE lb.year = ?`;
      let args = [currentYear];
  
      if (role !== 'admin' && role !== 'hr') {
        sql += ` AND (u.manager_id = ? OR u.id = ?)`;
        args.push(userId, userId);
      }
  
      const result = await db.execute({ sql, args });
      res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAllPendingLeaves = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role?.toLowerCase();
    try {
      let sql = "SELECT l.*, u.name as user_name FROM leaves l JOIN users u ON l.user_id = u.id WHERE l.status = 'Pending'";
      let args = [];
      if (role !== 'admin' && role !== 'hr') {
        sql += " AND l.manager_id = ?";
        args.push(userId);
      }
      const result = await db.execute({ sql: sql + " ORDER BY l.created_at DESC", args });
      res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};
