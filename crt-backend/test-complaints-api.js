const axios = require('axios');
require('dotenv').config();

const testApi = async () => {
    try {
        // We need a token. Let's get the admin token.
        // Assuming we can log in with admin/admin123
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            email: 'admin@crt.edu',
            password: 'admin123'
        });
        const token = loginRes.data.data.token;

        const res = await axios.get('http://localhost:5000/api/admin/complaints', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Complaints count:', res.data.data.complaints.length);
        console.log('Sample complaint:', JSON.stringify(res.data.data.complaints[0], null, 2));
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
};

testApi();
