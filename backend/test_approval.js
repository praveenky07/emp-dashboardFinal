const http = require('http');

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    };
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ body: JSON.parse(responseBody || '{}'), statusCode: res.statusCode });
        } catch (e) {
          resolve({ body: responseBody, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: headers
    };
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ body: JSON.parse(responseBody || '{}'), statusCode: res.statusCode });
        } catch (e) {
          resolve({ body: responseBody, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function put(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    };
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ body: JSON.parse(responseBody || '{}'), statusCode: res.statusCode });
        } catch (e) {
          resolve({ body: responseBody, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testApproval() {
  try {
    console.log("1. Logging in as Manager (manager@emp.com / manager123)...");
    const login = await post('/api/auth/login', { email: 'manager@emp.com', password: 'manager123' });
    if (login.statusCode !== 200) {
      console.error(`Login failed: ${login.statusCode}`, login.body);
      return;
    }

    const token = login.body.token;
    console.log(`Success! Logged in as ID ${login.body.user.id}`);

    console.log("\n2. Fetching pending leaves (GET /api/leave/pending)...");
    const pending = await get('/api/leave/pending', { Authorization: `Bearer ${token}` });
    if (pending.statusCode !== 200) {
      console.error(`Fetch failed: ${pending.statusCode}`, pending.body);
      return;
    }

    const leaves = pending.body;
    console.log(`Found ${leaves.length} pending leaves.`);
    if (leaves.length === 0) {
      console.log("Attempting to find ALL leaves to check if routing works...");
      const all = await get('/api/leave/team', { Authorization: `Bearer ${token}` });
      console.log(`Total team leaves visible: ${all.body.length}`);
      return;
    };

    const target = leaves[0];
    console.log(`Testing Leave ID: ${target.id}, AppliedTo: ${target.appliedTo}`);

    console.log("\n3. Attempting approval (PUT /api/leave/update-status)...");
    const update = await put('/api/leave/update-status', { id: target.id, status: 'Approved' }, { Authorization: `Bearer ${token}` });

    console.log("STATUS:", update.statusCode);
    console.log("RESPONSE:", update.body);
  } catch (err) {
    console.error("CRITICAL ERROR:", err.message);
  }
}

testApproval();
