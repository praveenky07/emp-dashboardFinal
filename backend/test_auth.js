async function testAuth() {
  const users = [
    { email: 'employee@test.com', password: '123456', role: 'employee' },
    { email: 'manager@test.com', password: '123456', role: 'manager' },
    { email: 'admin@test.com', password: '123456', role: 'admin' }
  ];

  for (const user of users) {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[SUCCESS] Login for ${user.role} (${user.email}): Token received`);
      } else {
        console.log(`[ERROR] Login failed for ${user.email}:`, data);
      }
    } catch (err) {
      console.log(`[ERROR] Login failed for ${user.email}:`, err.message);
    }
  }
}

testAuth();
