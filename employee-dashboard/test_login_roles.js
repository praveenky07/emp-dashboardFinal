const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testRoles() {
    try {
        console.log('--- Testing Admin Login ---');
        const adminRes = await axios.post(`${API_URL}/auth/login`, { username: 'admin', password: 'admin123' });
        console.log('Admin Login Success:', adminRes.data.user.role);

        console.log('\n--- Testing Manager Login ---');
        const mgrRes = await axios.post(`${API_URL}/auth/login`, { username: 'mgr1', password: 'password123' });
        console.log('Manager Login Success:', mgrRes.data.user.role);

        console.log('\n--- Testing Employee Login ---');
        const empRes = await axios.post(`${API_URL}/auth/login`, { username: 'emp1', password: 'password123' });
        console.log('Employee Login Success:', empRes.data.user.role);

    } catch (err) {
        console.error('Login Test Failed:', err.response?.data?.message || err.message);
    }
}

testRoles();
