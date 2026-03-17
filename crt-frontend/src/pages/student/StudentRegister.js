import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './StudentLogin.css';

const StudentRegister = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        studentId: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        const result = await register({
            name: formData.name,
            email: formData.email,
            studentId: formData.studentId,
            password: formData.password,
        });

        if (result.success) {
            // Don't navigate — show email verification prompt
            setRegistered(true);
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    // Success state — waiting for email verification
    if (registered) {
        return (
            <div className="login-container">
                <div className="login-card card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📧</div>
                    <h2 style={{ marginBottom: '12px' }}>Check your email!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        We've sent a verification link to <strong>{formData.email}</strong>.
                        Click the link in the email to activate your account, then log in.
                    </p>
                    <button className="btn btn-primary btn-block" onClick={() => navigate('/login')}>
                        Go to Login
                    </button>
                    <p style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Didn't receive it? Check your spam folder or{' '}
                        <Link to="/login">go to login</Link> to request a new link.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card card">
                <div className="login-header">
                    <h1>Student Registration</h1>
                    <p>Create your account to get started</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="name" className="label">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="label">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="studentId" className="label">Student ID</label>
                        <input
                            type="text"
                            id="studentId"
                            name="studentId"
                            className="input"
                            value={formData.studentId}
                            onChange={handleChange}
                            required
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
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StudentRegister;
