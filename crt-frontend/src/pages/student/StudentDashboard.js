import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchComplaints();
    }, [filter]);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await apiService.getStudentComplaints(params);
            setComplaints(response.data.data.complaints);
            setError('');
        } catch (err) {
            setError('Failed to load complaints');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getUrgencyBadge = (urgency) => {
        const classes = {
            low: 'badge-low',
            medium: 'badge-medium',
            high: 'badge-high',
            critical: 'badge-critical',
        };
        return <span className={`badge ${classes[urgency]}`}>{urgency}</span>;
    };

    if (loading) return <LoadingSpinner message="Loading your complaints..." />;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>My Complaints</h1>
                <Link to="/student/complaints/new" className="btn btn-primary">
                    + New Complaint
                </Link>
            </div>

            <div className="dashboard-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
                    onClick={() => setFilter('open')}
                >
                    Open
                </button>
                <button
                    className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
                    onClick={() => setFilter('in_progress')}
                >
                    In Progress
                </button>
                <button
                    className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
                    onClick={() => setFilter('resolved')}
                >
                    Resolved
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {complaints.length === 0 ? (
                <div className="empty-state card">
                    <h3>No complaints found</h3>
                    <p>You haven't submitted any complaints yet.</p>
                    <Link to="/student/complaints/new" className="btn btn-primary mt-2">
                        Submit Your First Complaint
                    </Link>
                </div>
            ) : (
                <div className="complaints-grid">
                    {complaints.map((complaint) => (
                        <Link
                            key={complaint.id}
                            to={`/student/complaints/${complaint.id}`}
                            className="complaint-card card"
                        >
                            <div className="complaint-header">
                                <h3>{complaint.title}</h3>
                                <StatusBadge status={complaint.status} />
                            </div>

                            <div className="complaint-meta">
                                <span className="category">{complaint.category}</span>
                                {getUrgencyBadge(complaint.urgency)}
                            </div>

                            <p className="complaint-description">
                                {complaint.description.substring(0, 150)}
                                {complaint.description.length > 150 ? '...' : ''}
                            </p>

                            <div className="complaint-footer">
                                <span className="date">
                                    Created: {new Date(complaint.created_at).toLocaleDateString()}
                                </span>
                                {complaint.assigned_worker_name && (
                                    <span className="assigned">
                                        Assigned to: {complaint.assigned_worker_name}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
