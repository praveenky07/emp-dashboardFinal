const login = async (email, password) => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
            console.log(`[SUCCESS] Logged in as: ${email}`);
            console.log('Status:', response.status);
        } else {
            console.log(`[FAILED] Login failed for: ${email}`);
            console.log('Status:', response.status);
            console.log('Message:', data.message || response.statusText);
        }
    } catch (error) {
        console.log(`[ERROR] Connection error for: ${email}`);
        console.log('Error:', error.message);
    }
};

const runTests = async () => {
    console.log('--- TESTING @test.com CREDENTIALS ---');
    await login('admin@test.com', 'admin123');
    await login('manager@test.com', 'manager123');
    await login('employee@test.com', 'employee123');
    
    console.log('\n--- TESTING @emp.com CREDENTIALS (README) ---');
    await login('admin@emp.com', 'admin123');
    await login('manager@emp.com', 'manager123');
    await login('employee@emp.com', 'employee123');
};

runTests();
