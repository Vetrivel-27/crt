import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './StudentLogin.css';

const StudentLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(formData.email, formData.password);

        if (result.success) {
            if (result.user.role === 'student') {
                navigate('/student/dashboard');
            } else {
                setError('This login is for students only. Please use the appropriate login page.');
                setLoading(false);
            }
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card card">
                <div className="login-header">
                    <h1>Student Login</h1>
                    <p>Welcome back! Please login to your account.</p>
                </div>

                {error && (
                    <div className="error-banner">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email" className="label">Email or Student ID</label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            className="input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email or student ID"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="label">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        Don't have an account? <Link to="/student/register">Register here</Link>
                    </p>
                    <p>
                        <Link to="/worker/login">Worker Login</Link> | <Link to="/admin/login">Admin Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
