const http = require('http');

async function testDash() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'employee@emp.com', password: 'employee123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  if (!token) {
    console.error('Login failed', loginData);
    return;
  }

  const reqObj = {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  };

  const getMethods = [
    '/api/time/status',
    '/api/time/stats',
    '/api/time/productivity',
    '/api/leave/my',
    '/api/leave/balance',
    '/api/payroll/my',
    '/api/tax/my',
    '/api/benefits/my',
    '/api/projects'
  ];

  console.log('--- GET Endpoints ---');
  for (const endpoint of getMethods) {
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, reqObj);
      const text = await res.text();
      let data = text;
      try { data = JSON.parse(text); } catch(e){}
      console.log(`[${res.status}] ${endpoint}:`, res.ok ? 'OK' : data);
    } catch(err) {
      console.log(`[ERROR] ${endpoint}:`, err.message);
    }
  }

  console.log('\n--- POST Endpoints ---');
  // test log meeting
  const meetRes = await fetch('http://localhost:5000/api/time/log-meeting', {
    ...reqObj, method: 'POST', body: JSON.stringify({ title: 'Test Meeting', duration: 30, type: 'Internal' })
  });
  const meetData = await meetRes.json();
  console.log(`[${meetRes.status}] /api/time/log-meeting:`, meetRes.ok ? 'OK' : meetData);

  // test apply leave
  const leaveRes = await fetch('http://localhost:5000/api/leave/apply', {
    ...reqObj, method: 'POST', body: JSON.stringify({ startDate: '2026-05-01', endDate: '2026-05-02', reason: 'Vacation' })
  });
  const leaveData = await leaveRes.json();
  console.log(`[${leaveRes.status}] /api/leave/apply:`, leaveRes.ok ? 'OK' : leaveData);


}
testDash();
