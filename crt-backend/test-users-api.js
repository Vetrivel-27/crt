const axios = require('axios');
require('dotenv').config();

const testApi = async () => {
    try {
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            email: 'admin@crt.edu',
            password: 'admin123'
        });
        const token = loginRes.data.data.token;

        console.log('Testing users endpoint with multiple roles...');
        const res = await axios.get('http://localhost:5000/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` },
            params: { role: 'worker,department_head' }
        });
        console.log('Users count:', res.data.data.users.length);
        console.log('Sample user roles:', res.data.data.users.map(u => u.role).slice(0, 5));
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
};

testApi();
