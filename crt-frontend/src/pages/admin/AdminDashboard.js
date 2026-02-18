import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOverview();
    }, []);

    const fetchOverview = async () => {
        try {
            const response = await apiService.getAdminOverview();
            setOverview(response.data.data);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading dashboard..." />;
    if (error) return <div className="container mt-4"><div className="error-banner">{error}</div></div>;
    if (!overview) return <div className="container mt-4">No data available</div>;

    return (
        <div className="container" style={{ maxWidth: '1200px', padding: 'var(--spacing-xl)' }}>
            <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Admin Dashboard</h1>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--primary-color)', marginBottom: 'var(--spacing-sm)' }}>{overview.totalComplaints}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Total Complaints</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--secondary-color)', marginBottom: 'var(--spacing-sm)' }}>{overview.totalStudents}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Students</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--primary-color)', marginBottom: 'var(--spacing-sm)' }}>{overview.totalWorkers}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Workers</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--secondary-color)', marginBottom: 'var(--spacing-sm)' }}>{overview.resolutionRate}%</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Resolution Rate</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--primary-color)', marginBottom: 'var(--spacing-sm)' }}>{overview.avgResolutionDays}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Avg Days to Resolve</p>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
                {/* By Status */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Complaints by Status</h3>
                    {Object.entries(overview.byStatus).map(([status, count]) => (
                        <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                            <strong style={{ color: 'var(--primary-color)' }}>{count}</strong>
                        </div>
                    ))}
                </div>

                {/* By Category */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Top Categories</h3>
                    {overview.byCategory.slice(0, 5).map((item) => (
                        <div key={item.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            <span>{item.category}</span>
                            <strong style={{ color: 'var(--secondary-color)' }}>{item.count}</strong>
                        </div>
                    ))}
                </div>

                {/* By Urgency */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>By Urgency</h3>
                    {Object.entries(overview.byUrgency).map(([urgency, count]) => (
                        <div key={urgency} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            <span className={`badge badge-${urgency}`}>{urgency}</span>
                            <strong>{count}</strong>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Insights */}
            {/*<div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>🤖 AI-Generated Insights</h3>
                <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
                    {overview.aiInsights.map((insight, i) => (
                        <li key={i} style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>{insight}</li>
                    ))}
                </ul>
            </div>
            */}
            {/* AI Recommendations */}
            {/*{overview.aiRecommendations && overview.aiRecommendations.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--spacing-xl)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'white' }}>💡 Recommendations</h3>
                    <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
                        {overview.aiRecommendations.map((rec, i) => (
                            <li key={i} style={{ marginBottom: 'var(--spacing-sm)' }}>{rec}</li>
                        ))}
                    </ul>
                </div>
            )}*/}

            {/* Recent Complaints */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Recent Complaints</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>ID</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Title</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Student</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Category</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Status</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Urgency</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Worker</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overview.recentComplaints.map((complaint) => (
                                <tr key={complaint.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: 'var(--spacing-sm)' }}>#{complaint.id}</td>
                                    <td style={{ padding: 'var(--spacing-sm)' }}>{complaint.title}</td>
                                    <td style={{ padding: 'var(--spacing-sm)' }}>{complaint.student_name}</td>
                                    <td style={{ padding: 'var(--spacing-sm)' }}>{complaint.category}</td>
                                    <td style={{ padding: 'var(--spacing-sm)' }}>
                                        <span className={`badge badge-${complaint.status}`}>
                                            {complaint.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm)' }}>
                                        <span className={`badge badge-${complaint.urgency}`}>{complaint.urgency}</span>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm)' }}>{complaint.worker_name || 'Unassigned'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <Link to="/admin/complaints" className="btn btn-primary">
                    Manage All Complaints
                </Link>
                <Link to="/admin/users" className="btn btn-secondary">
                    Manage Users
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
