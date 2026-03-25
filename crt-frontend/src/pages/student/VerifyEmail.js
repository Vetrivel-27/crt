import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import '../student/StudentLogin.css';

const VerifyEmail = () => {
    const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'expired' | 'invalid'
    const [message, setMessage] = useState('');
    const hasCalledAPI = useRef(false);

    useEffect(() => {
        // Prevent React StrictMode from firing this twice
        if (hasCalledAPI.current) return;
        
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            setStatus('invalid');
            setMessage('No verification token found in this link.');
            return;
        }

        hasCalledAPI.current = true;

        apiService.verifyEmail(token)
            .then((res) => {
                setStatus('success');
                setMessage(res.data.message);
            })
            .catch((err) => {
                const code = err.response?.data?.code;
                const msg = err.response?.data?.message || 'Verification failed.';
                setStatus(code === 'TOKEN_EXPIRED' ? 'expired' : 'invalid');
                setMessage(msg);
            });
    }, []);

    const titles = {
        verifying: 'Verifying your email...',
        success: 'Email Verified!',
        expired: 'Link Expired',
        invalid: 'Invalid Link',
    };

    return (
        <div className="login-container">
            <div className="login-card card" style={{ textAlign: 'center' }}>
                <h2 style={{ marginBottom: '12px' }}>{titles[status]}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>{message}</p>

                {status === 'success' && (
                    <Link to="/login" className="btn btn-primary btn-block">
                        Continue to Login
                    </Link>
                )}

                {status === 'expired' && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <Link to="/login">Go to Login</Link> to request a new verification email.
                    </p>
                )}

                {status === 'invalid' && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        If you copied the link from your email, please try clicking it directly.{' '}
                        <Link to="/login">Return to login</Link>.
                    </p>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
