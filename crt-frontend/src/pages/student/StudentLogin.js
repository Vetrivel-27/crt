import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import './StudentLogin.css';

const StudentLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [resendStatus, setResendStatus] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setUnverifiedEmail('');
        setResendStatus('');

        const result = await login(formData.email, formData.password, 'student');

        if (result.success) {
            navigate('/student/dashboard');
        } else {
            // Special case: email not verified
            if (result.code === 'EMAIL_NOT_VERIFIED') {
                setUnverifiedEmail(formData.email);
            }
            setError(result.message);
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendStatus('sending');
        try {
            await apiService.resendVerification(unverifiedEmail);
            setResendStatus('sent');
        } catch {
            setResendStatus('error');
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
                        {unverifiedEmail && (
                            <div style={{ marginTop: '10px' }}>
                                {resendStatus === 'sent' ? (
                                    <span style={{ color: '#2d6a35', fontWeight: 500 }}>
                                        ✓ Verification email resent! Check your inbox.
                                    </span>
                                ) : (
                                    <button
                                        className="btn-resend"
                                        onClick={handleResend}
                                        disabled={resendStatus === 'sending'}
                                    >
                                        {resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
                                    </button>
                                )}
                                {resendStatus === 'error' && (
                                    <span style={{ color: '#a8201a', marginLeft: '8px' }}>Failed to send. Try again.</span>
                                )}
                            </div>
                        )}
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
