require('dotenv').config({ path: 'c:/Users/user/antigravity/emp-dashboard/backend/.env' });
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function test() {
  try {
    const [u, s, l, m, d, tl] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM users'),
      db.execute('SELECT COUNT(*) as count FROM attendance WHERE clock_out IS NULL'),
      db.execute("SELECT COUNT(*) as count FROM leaves WHERE status = 'Pending'"),
      db.execute('SELECT COUNT(*) as count FROM meetings'),
      db.execute('SELECT COUNT(*) as count FROM departments'),
      db.execute('SELECT COUNT(*) as count FROM leaves')
    ]);

    console.log('--- DB STATS ---');
    console.log('totalUsers:', u.rows[0].count);
    console.log('activeSessions:', s.rows[0].count);
    console.log('pendingLeaves:', l.rows[0].count);
    console.log('totalMeetings:', m.rows[0].count);
    console.log('totalDepartments:', d.rows[0].count);
    console.log('totalLeaves:', tl.rows[0].count);
    
    console.log('\n--- Table Info (users) ---');
    const userSample = await db.execute('SELECT id, name, email FROM users LIMIT 3');
    console.log(JSON.stringify(userSample.rows, null, 2));

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    process.exit();
  }
}

test();
