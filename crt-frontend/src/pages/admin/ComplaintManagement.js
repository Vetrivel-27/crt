import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import './ComplaintManagement.css';

const ComplaintManagement = () => {
    const [complaints, setComplaints] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({});
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [assignWorkerId, setAssignWorkerId] = useState('');

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            const [complaintsRes, usersRes] = await Promise.all([
                apiService.getAllComplaints(filter),
                apiService.getAllUsers({ role: 'worker' }),
            ]);
            setComplaints(complaintsRes.data.data.complaints);
            setWorkers(usersRes.data.data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (complaintId) => {
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

    if (loading) return <LoadingSpinner message="Loading complaints..." />;

    return (
        <div className="complaint-management-container">
            <h1>Complaint Management</h1>

            <div className="filter-section">
                <h3>Filter Complaints</h3>
                <div className="filter-controls">
                    <button className={`filter-btn ${!filter.status ? 'active' : ''}`} onClick={() => setFilter({})}>
                        All
                    </button>
                    <button className={`filter-btn ${filter.status === 'open' ? 'active' : ''}`} onClick={() => setFilter({ status: 'open' })}>
                        Open
                    </button>
                    <button className={`filter-btn ${filter.status === 'in_progress' ? 'active' : ''}`} onClick={() => setFilter({ status: 'in_progress' })}>
                        In Progress
                    </button>
                    <button className={`filter-btn ${filter.status === 'resolved' ? 'active' : ''}`} onClick={() => setFilter({ status: 'resolved' })}>
                        Resolved
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="complaints-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Student</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Urgency</th>
                                <th>Worker</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map((complaint) => (
                                <tr key={complaint.id}>
                                    <td>#{complaint.id}</td>
                                    <td className="title-cell">{complaint.title}</td>
                                    <td>{complaint.student_name}</td>
                                    <td><span className="category-tag">{complaint.category}</span></td>
                                    <td><StatusBadge status={complaint.status} /></td>
                                    <td><span className={`badge badge-${complaint.urgency}`}>{complaint.urgency}</span></td>
                                    <td>{complaint.worker_name || 'Unassigned'}</td>
                                    <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn-small btn-primary"
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

            {selectedComplaint && (
                <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Assign Complaint #{selectedComplaint.id}</h3>
                        <p><strong>Title:</strong> {selectedComplaint.title}</p>
                        <div className="form-group">
                            <label className="label">Select Worker</label>
                            <select
                                className="input"
                                value={assignWorkerId}
                                onChange={(e) => setAssignWorkerId(e.target.value)}
                            >
                                <option value="">-- Select Worker --</option>
                                {workers.map((worker) => (
                                    <option key={worker.id} value={worker.id}>
                                        {worker.name} ({worker.department || 'No Department'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setSelectedComplaint(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => handleAssign(selectedComplaint.id)}>
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintManagement;
