import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import './WorkerDashboard.css';

const WorkerDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({});

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            const [complaintsRes, statsRes] = await Promise.all([
                apiService.getWorkerComplaints(filter),
                apiService.getWorkerStats(),
            ]);
            setComplaints(complaintsRes.data.data.complaints);
            setStats(statsRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = (newFilter) => {
        setFilter(newFilter);
        setLoading(true);
    };

    if (loading) return <LoadingSpinner message="Loading your complaints..." />;

    return (
        <div className="worker-dashboard-container">
            <h1>Worker Dashboard</h1>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.byStatus?.open || 0}</div>
                        <div className="stat-label">Open</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.byStatus?.in_progress || 0}</div>
                        <div className="stat-label">In Progress</div>
                    </div>
                    <div className="stat-card warning">
                        <div className="stat-value">{stats.overdueCount}</div>
                        <div className="stat-label">Overdue (7+ days)</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.avgResolutionDays}</div>
                        <div className="stat-label">Avg Days to Resolve</div>
                    </div>
                </div>
            )}

            <div className="filter-section">
                <h3>Filter Complaints</h3>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${!filter.status ? 'active' : ''}`}
                        onClick={() => applyFilter({})}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filter.status === 'open' ? 'active' : ''}`}
                        onClick={() => applyFilter({ status: 'open' })}
                    >
                        Open
                    </button>
                    <button
                        className={`filter-btn ${filter.status === 'in_progress' ? 'active' : ''}`}
                        onClick={() => applyFilter({ status: 'in_progress' })}
                    >
                        In Progress
                    </button>
                    <button
                        className={`filter-btn ${filter.status === 'resolved' ? 'active' : ''}`}
                        onClick={() => applyFilter({ status: 'resolved' })}
                    >
                        Resolved
                    </button>
                </div>
            </div>

            {complaints.length === 0 ? (
                <div className="empty-state card">
                    <h3>No complaints found</h3>
                    <p>You don't have any assigned complaints matching the current filter.</p>
                </div>
            ) : (
                <div className="complaints-list">
                    {complaints.map((c) => (
                        <Link key={c.id} to={`/worker/complaints/${c.id}`} className="worker-complaint-card card">
                            <div className="complaint-card-header">
                                <div>
                                    <h3>{c.title}</h3>
                                    <p className="student-info">
                                        Student: {c.student_name} ({c.student_id || c.student_email})
                                    </p>
                                </div>
                                <StatusBadge status={c.status} />
                            </div>

                            <p className="complaint-preview">{c.description.substring(0, 200)}...</p>

                            <div className="complaint-card-footer">
                                <span className="category-tag">{c.category}</span>
                                <span className={`badge badge-${c.urgency}`}>{c.urgency}</span>
                                <span className="date-info">
                                    Created: {new Date(c.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkerDashboard;
