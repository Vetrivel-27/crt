import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
    const [overview, setOverview] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [assignWorkerId, setAssignWorkerId] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [overviewRes, workersRes] = await Promise.all([
                apiService.getAdminOverview(),
                apiService.getAllUsers({ role: 'worker,department_head' })
            ]);
            setOverview(overviewRes.data.data);
            setWorkers(workersRes.data.data.users);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAssign = async (complaintId) => {
        if (!assignWorkerId) {
            alert('Please select a worker');
            return;
        }
        try {
            await apiService.assignComplaint(complaintId, { workerId: assignWorkerId });
            await fetchData();
            setSelectedComplaint(null);
            setAssignWorkerId('');
            alert('Complaint assigned successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to assign complaint');
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

            {/* Recent Complaints */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 0 }}>
                <h3 style={{ padding: 'var(--spacing-md)', margin: 0, borderBottom: '1px solid var(--border-color)' }}>Recent Complaints</h3>
                <div style={{ height: '400px', overflowY: 'auto', padding: '0 var(--spacing-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>#</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Title</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Student</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Urgency</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Worker</th>
                                <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overview.recentComplaints.map((complaint) => (
                                <tr key={complaint.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: 'var(--spacing-sm)', fontSize: '0.85rem' }}>{complaint.id}</td>
                                    <td style={{ padding: 'var(--spacing-sm)', fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={complaint.title}>
                                        {complaint.is_escalated && (
                                            <span className="badge badge-error" style={{ fontSize: '0.65rem', marginRight: 'var(--spacing-xs)', background: '#dc3545', color: 'white' }}>ESCALATED</span>
                                        )}
                                        {complaint.title}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm)', fontSize: '0.85rem' }}>{complaint.student_name}</td>
                                    <td style={{ padding: 'var(--spacing-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {new Date(complaint.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm)' }}>
                                        <span className={`badge badge-${complaint.urgency}`} style={{ fontSize: '0.7rem' }}>{complaint.urgency}</span>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm)', fontSize: '0.85rem' }}>
                                        {complaint.worker_name || 'Unassigned'}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm)' }}>
                                        <button 
                                            className="btn-small btn-primary" 
                                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                            onClick={() => {
                                                setSelectedComplaint(complaint);
                                                setAssignWorkerId(complaint.assigned_worker_id || '');
                                            }}
                                        >
                                            Assign
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <Link to="/admin/users" className="btn btn-secondary">
                    Manage Users
                </Link>
            </div>

            {selectedComplaint && (
                <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Quick Assign #{selectedComplaint.id}</h3>
                        <p><strong>Title:</strong> {selectedComplaint.title}</p>
                        <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label className="label">Select Staff</label>
                            <select
                                className="input"
                                value={assignWorkerId}
                                onChange={(e) => setAssignWorkerId(e.target.value)}
                                style={{ width: '100%', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                            >
                                <option value="">-- Select Worker/Head --</option>
                                {workers.map((worker) => (
                                    <option key={worker.id} value={worker.id}>
                                        {worker.name} ({worker.department || 'No Dept'}) - {worker.role}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setSelectedComplaint(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => handleQuickAssign(selectedComplaint.id)}>
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
