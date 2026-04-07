const { db } = require('./db');

// Table initialization for activity_logs is handled in db.js or here
const initLogs = async () => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        metadata TEXT, -- JSON string
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Error initializing activity logs:', error.message);
  }
};

initLogs();

const logActivity = async (userId, action, metadata = {}) => {
  try {
    await db.execute({
      sql: 'INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)',
      args: [userId, action, JSON.stringify(metadata)]
    });
  } catch (error) {
    console.error('Logging failed:', error.message);
  }
};

const getLogs = async (userId) => {
  const query = userId 
    ? 'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100' 
    : 'SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100';
  
  const result = await db.execute({
    sql: query,
    args: userId ? [userId] : []
  });
  
  return result.rows.map(r => ({...r, metadata: JSON.parse(r.metadata || '{}')}));
};

module.exports = { logActivity, getLogs };
