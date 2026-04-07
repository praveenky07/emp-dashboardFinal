const BASE_URL = 'http://localhost:5000';

const testRoute = async (name, endpoint) => {
    try {
        console.log(`Testing ${name} (${endpoint})...`);
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const data = await response.text();
        console.log(`Response status: ${response.status}`);
        console.log(`Response preview: ${data.substring(0, 100)}`);
        return response.ok;
    } catch (err) {
        console.error(`Error testing ${name}:`, err.message);
        return false;
    }
};

const simulateLogin = async (email, password) => {
    try {
        console.log(`Simulating login for ${email}...`);
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        console.log(`Response status: ${response.status}`);
        if (response.ok) {
            console.log('Login successful! Token generated.');
        } else {
            console.log(`Login failed: ${data.message || response.statusText}`);
        }
        return response.ok;
    } catch (err) {
        console.error('Error simulating login:', err.message);
        return false;
    }
};

const runAll = async () => {
    console.log('--- STARTING BACKEND VERIFICATION ---\n');
    
    await testRoute('Health Check', '/health');
    await testRoute('API Check', '/api');
    
    console.log('\nResetting database via /fix-user...');
    const fixed = await testRoute('Fix User', '/fix-user');
    
    if (fixed) {
        console.log('\nWaiting 2 seconds for DB updates...');
        await new Promise(r => setTimeout(r, 2000));
        
        console.log('\nTesting Login with fixed user...');
        await simulateLogin('admin@test.com', 'admin123');
    } else {
        console.log('\nSkipping login test because /fix-user failed.');
    }
    
    console.log('\n--- VERIFICATION COMPLETE ---');
};

runAll();
