import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--spacing-2xl)',
            gap: 'var(--spacing-md)'
        }}>
            <div className="loading-spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
        </div>
    );
};

export default LoadingSpinner;
