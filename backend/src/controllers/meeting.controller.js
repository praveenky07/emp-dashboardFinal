const { db } = require('../db/db');
const { logActivity } = require('../db/logs');
const crypto = require('crypto');
const emailService = require('../utils/email');
const { getIo } = require('../socket');
const { emitMeetingCreated, emitMeetingUpdated, emitMeetingEnded, emitMeetingJoined } = require('../socket/events');

exports.createMeeting = async (req, res) => {
  const { title, duration, participants, dateTime, category } = req.body;
  const createdBy = req.user.id;

  if (!title || !dateTime) {
    return res.status(400).json({ error: 'Meeting title and date/time are required' });
  }

  try {
    const meetingId = crypto.randomUUID();
    const roomId = "emp-" + Date.now();
    const videoLink = `https://meet.jit.si/${roomId}`;
    const meetingLink = `/meet/${meetingId}`;
    const participantsJson = JSON.stringify(participants || []);
    
    await db.execute({
      sql: `INSERT INTO meetings (id, purpose, duration, category, created_by, participants, meeting_link, video_link, room_id, status, scheduled_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [meetingId, title, duration || 30, category || 'General', createdBy, participantsJson, meetingLink, videoLink, roomId, 'scheduled', dateTime]
    });

    await logActivity(createdBy, 'create_meeting', { meetingId, title });
    
    try {
        emitMeetingCreated(getIo(), { meetingId, createdBy, title, participants: participants || [] });
    } catch(e) { console.error('Socket emit error', e) }

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting: {
        id: meetingId,
        title,
        duration,
        createdBy,
        participants: participants || [],
        videoLink,
        roomId,
        status: 'scheduled',
        dateTime
      }
    });
  } catch (error) {
    console.error('Create Meeting Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMeetings = async (req, res) => {
  const userId = req.user.id;
  const userRole = (req.user.role || '').toLowerCase();

  try {
    let sql = `
      SELECT m.*, u.name as creator_name, 
      (SELECT COUNT(*) FROM meeting_attendance WHERE meeting_id = m.id) as joined_count
      FROM meetings m 
      JOIN users u ON m.created_by = u.id
    `;
    let args = [];

    if (userRole === 'employee') {
      sql += ` WHERE m.created_by = ? OR m.participants LIKE ?`;
      args.push(userId, `%${userId}%`);
    } else if (userRole === 'manager') {
      sql += ` WHERE m.created_by = ? OR m.created_by IN (SELECT id FROM users WHERE manager_id = ?) OR m.participants LIKE ?`;
      args.push(userId, userId, `%${userId}%`);
    }

    sql += ' ORDER BY m.scheduled_at ASC';

    const result = await db.execute({ sql, args });
    
    const meetings = result.rows.map(row => {
      return {
        ...row,
        title: row.purpose,
        dateTime: row.scheduled_at,
        hostId: row.created_by,
        participants: JSON.parse(row.participants || '[]')
      };
    });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMeetingById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: 'SELECT m.*, u.name as creator_name FROM meetings m JOIN users u ON m.created_by = u.id WHERE m.id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = result.rows[0];
    meeting.participants = JSON.parse(meeting.participants || '[]');

    // Fetch details of participants
    if (meeting.participants.length > 0) {
        const participantIds = meeting.participants.join(',');
        const usersResult = await db.execute({
            sql: `SELECT id, name, email FROM users WHERE id IN (${participantIds})`,
            args: []
        });
        meeting.participantDetails = usersResult.rows;
    } else {
        meeting.participantDetails = [];
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMeeting = async (req, res) => {
  const { id } = req.params;
  const { title, purpose, duration, category, participants, status, dateTime, scheduled_at } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    // Check ownership or admin
    const check = await db.execute({ sql: 'SELECT created_by FROM meetings WHERE id = ?', args: [id] });
    if (check.rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });
    
    if (role !== 'Admin' && check.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this meeting' });
    }

    const participantsJson = participants ? JSON.stringify(participants) : undefined;

    let updateFields = [];
    let args = [];
    const meetingTitle = title || purpose;
    const meetingAt = dateTime || scheduled_at;

    if (meetingTitle) { updateFields.push('purpose = ?'); args.push(meetingTitle); }
    if (duration) { updateFields.push('duration = ?'); args.push(duration); }
    if (category) { updateFields.push('category = ?'); args.push(category); }
    if (participantsJson) { updateFields.push('participants = ?'); args.push(participantsJson); }
    if (status) { updateFields.push('status = ?'); args.push(status); }
    if (meetingAt) { updateFields.push('scheduled_at = ?'); args.push(meetingAt); }

    console.log(`[DEBUG] Updating meeting ${id} with fields:`, updateFields);
    args.push(id);
    await db.execute({
      sql: `UPDATE meetings SET ${updateFields.join(', ')} WHERE id = ?`,
      args
    });

    console.log(`[DEBUG] Meeting ${id} updated in DB.`);

    // Fetch the updated meeting to return it
    const updatedResult = await db.execute({
      sql: 'SELECT m.*, u.name as creator_name FROM meetings m JOIN users u ON m.created_by = u.id WHERE m.id = ?',
      args: [id]
    });
    
    let updatedMeeting = updatedResult.rows[0];
    if (updatedMeeting) {
        updatedMeeting.participants = JSON.parse(updatedMeeting.participants || '[]');
    }

    try {
        if (status === 'completed') {
            console.log(`[DEBUG] Emitting meetingEnded for ${id}`);
            emitMeetingEnded(getIo(), id);
        } else if (status === 'ongoing') {
            console.log(`[DEBUG] Emitting meetingStarted for ${id}`);
            emitMeetingStarted(getIo(), id);
        } else if (status) {
            emitMeetingUpdated(getIo(), { meetingId: id, status });
        }
    } catch(e) { console.error('Socket error emitting meeting update', e) }

    res.json(updatedMeeting || { message: 'Meeting updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    // Check if meeting exists and who is the creator
    const result = await db.execute({
      sql: 'SELECT created_by FROM meetings WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meetingCreator = result.rows[0].created_by;

    // Authorization: Admin or Creator
    if (role !== 'Admin' && userId !== meetingCreator) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own meetings' });
    }

    await db.execute({ sql: 'DELETE FROM meetings WHERE id = ?', args: [id] });
    
    await logActivity(userId, 'delete_meeting', { meetingId: id });
    
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Delete Meeting Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.joinMeeting = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        await db.execute({
            sql: 'INSERT INTO meeting_attendance (meeting_id, user_id) VALUES (?, ?)',
            args: [id, userId]
        });
        
        try {
            emitMeetingJoined(getIo(), { meetingId: id, userId });
        } catch(e) { console.error('Socket error', e) }
        
        res.json({ message: 'Joined meeting' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    try {
        const total = await db.execute({ sql: 'SELECT COUNT(*) as count FROM meetings', args: [] });
        const active = await db.execute({ sql: "SELECT COUNT(*) as count FROM meetings WHERE status = 'scheduled'", args: [] });
        const mostActive = await db.execute({
            sql: `SELECT u.name, COUNT(m.id) as meeting_count 
                  FROM users u 
                  JOIN meetings m ON u.id = m.created_by 
                  GROUP BY u.id 
                  ORDER BY meeting_count DESC 
                  LIMIT 5`,
            args: []
        });

        res.json({
            totalMeetings: total.rows[0].count,
            activeMeetings: active.rows[0].count,
            mostActiveEmployees: mostActive.rows  
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
