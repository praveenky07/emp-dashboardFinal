const db = require('../db/db');
const { logActivity } = require('../db/logs');

exports.startWork = async (req, res) => {
  const userId = req.user.id;
  try {
    const activeResult = await db.execute({
      sql: 'SELECT id FROM attendance WHERE user_id = ? AND logout_time IS NULL',
      args: [userId]
    });
    if (activeResult.rows.length > 0) return res.status(400).json({ error: 'Day already started' });

    const result = await db.execute({
      sql: 'INSERT INTO attendance (user_id, login_time) VALUES (?, ?)',
      args: [userId, new Date().toISOString()]
    });
    
    await logActivity(userId, 'start_day', { id: result.lastInsertRowid.toString() });
    res.json({ message: 'Day started successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.stopWork = async (req, res) => {
  const userId = req.user.id;
  try {
    const activeResult = await db.execute({
      sql: 'SELECT id FROM attendance WHERE user_id = ? AND logout_time IS NULL',
      args: [userId]
    });
    const attendance = activeResult.rows[0];
    if (!attendance) return res.status(400).json({ error: 'No active session found' });

    await db.execute({
      sql: 'UPDATE attendance SET logout_time = ? WHERE id = ?',
      args: [new Date().toISOString(), attendance.id]
    });
    
    await logActivity(userId, 'stop_day', { id: attendance.id });
    res.json({ message: 'Day ended successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.startBreak = async (req, res) => {
  const userId = req.user.id;
  const { type } = req.body;
  try {
    // Check if on break
    const activeBreak = await db.execute({
      sql: 'SELECT id FROM breaks WHERE user_id = ? AND end_time IS NULL',
      args: [userId]
    });
    if (activeBreak.rows.length > 0) return res.status(400).json({ error: 'Break already in progress' });

    await db.execute({
      sql: 'INSERT INTO breaks (user_id, type, start_time) VALUES (?, ?, ?)',
      args: [userId, type || 'Other', new Date().toISOString()]
    });
    
    await logActivity(userId, 'start_break', { type });
    res.json({ message: 'Break started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.stopBreak = async (req, res) => {
  const userId = req.user.id;
  try {
    const activeBreak = await db.execute({
      sql: 'SELECT id FROM breaks WHERE user_id = ? AND end_time IS NULL',
      args: [userId]
    });
    const brk = activeBreak.rows[0];
    if (!brk) return res.status(400).json({ error: 'No active break found' });

    await db.execute({
      sql: 'UPDATE breaks SET end_time = ? WHERE id = ?',
      args: [new Date().toISOString(), brk.id]
    });
    
    await logActivity(userId, 'stop_break', { id: brk.id });
    res.json({ message: 'Break ended' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logMeeting = async (req, res) => {
  const userId = req.user.id;
  const { title, duration, type } = req.body;
  try {
    await db.execute({
      sql: 'INSERT INTO meetings (user_id, title, duration, type) VALUES (?, ?, ?, ?)',
      args: [userId, title, duration, type]
    });
    await logActivity(userId, 'log_meeting', { title, duration });
    res.json({ message: 'Meeting logged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSessionStatus = async (req, res) => {
  const userId = req.user.id;
  try {
    const attendance = await db.execute({
      sql: 'SELECT * FROM attendance WHERE user_id = ? AND logout_time IS NULL',
      args: [userId]
    });
    const brk = await db.execute({
      sql: 'SELECT * FROM breaks WHERE user_id = ? AND end_time IS NULL',
      args: [userId]
    });

    res.json({
      active: attendance.rows.length > 0,
      startTime: attendance.rows[0]?.login_time,
      onBreak: brk.rows.length > 0,
      breakType: brk.rows[0]?.type
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeStats = async (req, res) => {
  const userId = req.user.id;
  try {
    // Total Work: Sum of (logout - login)
    const workRes = await db.execute({
      sql: `SELECT login_time, logout_time FROM attendance WHERE user_id = ?`,
      args: [userId]
    });
    
    let totalWorkSec = 0;
    workRes.rows.forEach(r => {
      const start = new Date(r.login_time);
      const end = r.logout_time ? new Date(r.logout_time) : new Date();
      totalWorkSec += Math.floor((end - start) / 1000);
    });

    // Total Break: Sum of (end - start)
    const breakRes = await db.execute({
        sql: `SELECT start_time, end_time FROM breaks WHERE user_id = ?`,
        args: [userId]
    });
    let totalBreakSec = 0;
    breakRes.rows.forEach(r => {
        const start = new Date(r.start_time);
        const end = r.end_time ? new Date(r.end_time) : new Date();
        totalBreakSec += Math.floor((end - start) / 1000);
    });

    // Total Meeting: Sum of duration (stored in minutes)
    const meetingRes = await db.execute({
        sql: `SELECT SUM(duration) as total FROM meetings WHERE user_id = ?`,
        args: [userId]
    });
    const totalMeetingMin = meetingRes.rows[0]?.total || 0;
    const totalMeetingSec = totalMeetingMin * 60;

    // Productivity Score = work_time - (break_time + meeting_time)
    // We'll return it in seconds
    const productivityValue = totalWorkSec - (totalBreakSec + totalMeetingSec);

    // Weekly Data (Daily work hours)
    const weeklyRes = await db.execute({
        sql: `
            SELECT date(login_time) as date, login_time, logout_time 
            FROM attendance 
            WHERE user_id = ? AND login_time > date('now', '-7 days')
        `,
        args: [userId]
    });

    const dailyMap = {};
    weeklyRes.rows.forEach(r => {
        const start = new Date(r.login_time);
        const end = r.logout_time ? new Date(r.logout_time) : new Date();
        const dur = Math.floor((end - start) / 1000);
        dailyMap[r.date] = (dailyMap[r.date] || 0) + dur;
    });

    const weeklyData = Object.keys(dailyMap).map(date => ({ date, work_duration: dailyMap[date] }));

    // Lists
    const meetingsResArr = await db.execute({ sql: 'SELECT * FROM meetings WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', args: [userId] });
    const breaksResArr = await db.execute({ sql: 'SELECT * FROM breaks WHERE user_id = ? ORDER BY start_time DESC LIMIT 10', args: [userId] });
    
    const processedBreaks = breaksResArr.rows.map(b => {
        const start = new Date(b.start_time);
        const end = b.end_time ? new Date(b.end_time) : new Date();
        return { ...b, duration: Math.floor((end - start) / 1000) };
    });

    res.json({
      totalWorkTime: totalWorkSec,
      totalBreakTime: totalBreakSec,
      totalMeetingTime: totalMeetingSec,
      productivityScore: productivityValue,
      weeklyData,
      meetingsList: meetingsResArr.rows,
      breaksList: processedBreaks
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductivity = async (req, res) => {
    // Re-use logic for consistency
    return exports.getEmployeeStats(req, res);
};

exports.manualOverride = async (req, res) => {
    const userId = req.user.id;
    const { type, startTime, endTime, reason } = req.body;
    try {
        if (type === 'attendance') {
            await db.execute({
                sql: 'INSERT INTO attendance (user_id, login_time, logout_time) VALUES (?, ?, ?)',
                args: [userId, startTime, endTime]
            });
        } else if (type === 'break') {
            await db.execute({
                sql: 'INSERT INTO breaks (user_id, type, start_time, end_time) VALUES (?, ?, ?, ?)',
                args: [userId, 'Manual Override', startTime, endTime]
            });
        }
        await logActivity(userId, 'manual_override', { type, reason });
        res.json({ message: 'Manual override logged' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getWorkHours = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM attendance WHERE user_id = ? ORDER BY login_time DESC',
            args: [userId]
        });
        const rows = result.rows.map(r => {
            const start = new Date(r.login_time);
            const end = r.logout_time ? new Date(r.logout_time) : new Date();
            return {
                ...r,
                total_duration: Math.floor((end - start) / 1000)
            };
        });
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
