const db = require('../db/db');
const { logActivity } = require('../db/logs');

exports.startWork = async (req, res) => {
  const userId = req.user.id;
  try {
    const activeSessionResult = await db.execute({
      sql: 'SELECT id FROM work_sessions WHERE user_id = ? AND end_time IS NULL',
      args: [userId]
    });
    if (activeSessionResult.rows.length > 0) return res.status(400).json({ message: 'Session already active' });

    const result = await db.execute({
      sql: 'INSERT INTO work_sessions (user_id, start_time) VALUES (?, ?)',
      args: [userId, new Date().toISOString()]
    });
    const sessionId = result.lastInsertRowid?.toString();
    await logActivity(userId, 'start_work', { sessionId });
    res.json({ message: 'Work started', sessionId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.stopWork = async (req, res) => {
  const userId = req.user.id;
  try {
    const sessionResult = await db.execute({
      sql: 'SELECT * FROM work_sessions WHERE user_id = ? AND end_time IS NULL',
      args: [userId]
    });
    const session = sessionResult.rows[0];
    if (!session) return res.status(400).json({ message: 'No active session found' });

    const endTime = new Date();
    const startTime = new Date(session.start_time);
    const duration = Math.floor((endTime - startTime) / 1000); 

    await db.execute({
      sql: 'UPDATE work_sessions SET end_time = ?, total_duration = ? WHERE id = ?',
      args: [endTime.toISOString(), duration, session.id]
    });
    await logActivity(userId, 'stop_work', { sessionId: session.id, duration });
    res.json({ message: 'Work stopped', duration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.startBreak = async (req, res) => {
  const userId = req.user.id;
  const { type } = req.body;
  try {
    const sessionResult = await db.execute({
      sql: 'SELECT id FROM work_sessions WHERE user_id = ? AND end_time IS NULL',
      args: [userId]
    });
    const session = sessionResult.rows[0];
    if (!session) return res.status(400).json({ message: 'No active work session' });

    const activeBreakResult = await db.execute({
      sql: 'SELECT id FROM breaks WHERE session_id = ? AND end_time IS NULL',
      args: [session.id]
    });
    if (activeBreakResult.rows.length > 0) return res.status(400).json({ message: 'Break already in progress' });

    const result = await db.execute({
      sql: 'INSERT INTO breaks (session_id, type, start_time) VALUES (?, ?, ?)',
      args: [session.id, type || 'Break', new Date().toISOString()]
    });
    const breakId = result.lastInsertRowid?.toString();
    await logActivity(userId, 'start_break', { sessionId: session.id, breakId, type });
    res.json({ message: 'Break started', breakId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.stopBreak = async (req, res) => {
  const userId = req.user.id;
  try {
    const sessionResult = await db.execute({
      sql: 'SELECT id FROM work_sessions WHERE user_id = ? AND end_time IS NULL',
      args: [userId]
    });
    const session = sessionResult.rows[0];
    if (!session) return res.status(400).json({ message: 'No active work session' });

    const activeBreakResult = await db.execute({
      sql: 'SELECT * FROM breaks WHERE session_id = ? AND end_time IS NULL',
      args: [session.id]
    });
    const activeBreak = activeBreakResult.rows[0];
    if (!activeBreak) return res.status(400).json({ message: 'No active break found' });

    const endTime = new Date();
    const startTime = new Date(activeBreak.start_time);
    const duration = Math.floor((endTime - startTime) / 1000);

    await db.execute({
      sql: 'UPDATE breaks SET end_time = ?, duration = ? WHERE id = ?',
      args: [endTime.toISOString(), duration, activeBreak.id]
    });
    await logActivity(userId, 'stop_break', { breakId: activeBreak.id, duration });
    res.json({ message: 'Break ended', duration });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    await logActivity(userId, 'log_meeting', { title, duration, type });
    res.json({ message: 'Meeting logged' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSessionStatus = async (req, res) => {
  const userId = req.user.id;
  try {
    const sessionResult = await db.execute({
      sql: 'SELECT * FROM work_sessions WHERE user_id = ? AND end_time IS NULL',
      args: [userId]
    });
    const session = sessionResult.rows[0];
    if (!session) return res.json({ active: false });

    const activeBreakResult = await db.execute({
      sql: 'SELECT * FROM breaks WHERE session_id = ? AND end_time IS NULL',
      args: [session.id]
    });
    const activeBreak = activeBreakResult.rows[0];
    res.json({
      active: true,
      sessionId: session.id,
      startTime: session.start_time,
      onBreak: !!activeBreak,
      breakType: activeBreak ? activeBreak.type : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployeeStats = async (req, res) => {
  const userId = req.user.id;
  try {
    const workHoursResult = await db.execute({
      sql: 'SELECT SUM(total_duration) as total FROM work_sessions WHERE user_id = ?',
      args: [userId]
    });
    const breakHoursResult = await db.execute({
      sql: 'SELECT SUM(duration) as total FROM breaks WHERE session_id IN (SELECT id FROM work_sessions WHERE user_id = ?)',
      args: [userId]
    });
    const meetingsCountResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM meetings WHERE user_id = ?',
      args: [userId]
    });
    const meetingsResult = await db.execute({
      sql: 'SELECT * FROM meetings WHERE user_id = ? ORDER BY created_at DESC',
      args: [userId]
    });
    const breaksResult = await db.execute({
      sql: 'SELECT * FROM breaks WHERE session_id IN (SELECT id FROM work_sessions WHERE user_id = ?) ORDER BY start_time DESC',
      args: [userId]
    });

    const weeklyDataResult = await db.execute({
      sql: `
        SELECT date(start_time) as date, SUM(total_duration) as work_duration
        FROM work_sessions
        WHERE user_id = ? AND date(start_time) > date('now', '-7 days')
        GROUP BY date(start_time)
      `,
      args: [userId]
    });

    res.json({
      totalWorkTime: workHoursResult.rows[0]?.total || 0,
      totalBreakTime: breakHoursResult.rows[0]?.total || 0,
      totalMeetings: meetingsCountResult.rows[0]?.count || 0,
      meetingsList: meetingsResult.rows,
      breaksList: breaksResult.rows,
      weeklyData: weeklyDataResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductivity = async (req, res) => {
    const userId = req.user.id;
    try {
        const statsResult = await db.execute({
            sql: `
                SELECT 
                    SUM(total_duration) as total_work,
                    (SELECT SUM(duration) FROM breaks WHERE session_id IN (SELECT id FROM work_sessions WHERE user_id = ?)) as total_break
                FROM work_sessions 
                WHERE user_id = ?
            `,
            args: [userId, userId]
        });
        
        const stats = statsResult.rows[0];
        const work = stats?.total_work || 0;
        const breaks = stats?.total_break || 0;
        const score = work > 0 ? Math.min(100, Math.round((work / (work + breaks)) * 100)) : 0;
        
        res.json({ score, work, breaks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getWorkHours = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM work_sessions WHERE user_id = ? ORDER BY start_time DESC',
            args: [userId]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
