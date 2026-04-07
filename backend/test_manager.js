const http = require('http');

async function testManager() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@emp.com', password: 'manager123' })
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
    '/api/pulse/frontend',
    '/api/pulse/deadlines'
  ];

  console.log('--- GET Endpoints ---');
  for (const endpoint of getMethods) {
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, reqObj);
      const data = await res.text();
      try {
        console.log(`[${res.status}] ${endpoint}:`, JSON.parse(data));
      } catch (e) {
        console.log(`[${res.status}] ${endpoint}:`, data);
      }
    } catch(err) {
      console.log(`[ERROR] ${endpoint}:`, err.message);
    }
  }
}
testManager();
