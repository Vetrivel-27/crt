import React from 'react';

const StatusBadge = ({ status }) => {
    const getStatusClass = () => {
        switch (status?.toLowerCase()) {
            case 'open':
                return 'badge-open';
            case 'in_progress':
            case 'in progress':
                return 'badge-in-progress';
            case 'resolved':
                return 'badge-resolved';
            case 'closed':
                return 'badge-closed';
            default:
                return 'badge-closed';
        }
    };

    const getStatusText = () => {
        if (status === 'in_progress') return 'In Progress';
        return status?.charAt(0).toUpperCase() + status?.slice(1);
    };

    return <span className={`badge ${getStatusClass()}`}>{getStatusText()}</span>;
};

export default StatusBadge;
