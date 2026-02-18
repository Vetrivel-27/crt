import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../student/StudentLogin.css';

const AdminLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(formData.email, formData.password);

        if (result.success && result.user.role === 'admin') {
            navigate('/admin/dashboard');
        } else if (result.success) {
            setError('This login is for administrators only.');
            setLoading(false);
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card card">
                <div className="login-header">
                    <h1>Admin Login</h1>
                    <p>System Administration Access</p>
                </div>
                {error && <div className="error-banner">{error}</div>}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email" className="label">Email</label>
                        <input type="email" id="email" name="email" className="input" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password" className="label">Password</label>
                        <input type="password" id="password" name="password" className="input" value={formData.password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="login-footer">
                    <p><Link to="/student/login">Student Login</Link> | <Link to="/worker/login">Worker Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
