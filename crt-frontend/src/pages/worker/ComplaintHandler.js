import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import './ComplaintHandler.css';

const ComplaintHandler = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusUpdate, setStatusUpdate] = useState({ status: '', note: '', resolutionMessage: '' });
    const [newNote, setNewNote] = useState({ note: '', isPublic: true });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchComplaintDetails();
    }, [id]);

    const fetchComplaintDetails = async () => {
        try {
            const response = await apiService.getWorkerComplaintDetails(id);
            setData(response.data.data);
            setStatusUpdate({ ...statusUpdate, status: response.data.data.complaint.status });
        } catch (err) {
            console.error(err);
            alert('Failed to load complaint or you do not have access');
            navigate('/worker/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await apiService.updateComplaintStatus(id, statusUpdate);
            await fetchComplaintDetails();
            setStatusUpdate({ ...statusUpdate, note: '', resolutionMessage: '' });
            alert('Status updated successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        try {
            await apiService.addComplaintNote(id, newNote);
            await fetchComplaintDetails();
            setNewNote({ note: '', isPublic: true });
            alert('Note added successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to add note');
        }
    };

    if (loading) return <LoadingSpinner message="Loading complaint..." />;
    if (!data) return <div className="container mt-4">Complaint not found</div>;

    const { complaint, history, feedback } = data;

    return (
        <div className="complaint-handler-container">
            <button onClick={() => navigate('/worker/dashboard')} className="btn btn-outline mb-3">
                ← Back to Dashboard
            </button>

            <div className="card">
                <div className="handler-header">
                    <h1>{complaint.title}</h1>
                    <StatusBadge status={complaint.status} />
                </div>

                <div className="complaint-info-grid">
                    <div className="info-item">
                        <strong>Student:</strong>
                        <span>{complaint.student_name}</span>
                    </div>
                    <div className="info-item">
                        <strong>Email:</strong>
                        <span>{complaint.student_email}</span>
                    </div>
                    <div className="info-item">
                        <strong>Student ID:</strong>
                        <span>{complaint.student_id || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <strong>Category:</strong>
                        <span className="category-badge">{complaint.category}</span>
                    </div>
                    <div className="info-item">
                        <strong>Urgency:</strong>
                        <span className={`badge badge-${complaint.urgency}`}>{complaint.urgency}</span>
                    </div>
                    <div className="info-item">
                        <strong>Created:</strong>
                        <span>{new Date(complaint.created_at).toLocaleString()}</span>
                    </div>
                </div>

                <div className="section">
                    <h3>Description</h3>
                    <p className="description">{complaint.description}</p>
                </div>

                {/*{complaint.ai_summary && (
                    <div className="ai-summary">
                        <h4>🤖 AI Summary</h4>
                        <p>{complaint.ai_summary}</p>
                    </div>
                )}*/}
            </div>

            <div className="card mt-3">
                <h3>Update Status</h3>
                <form onSubmit={handleStatusUpdate} className="status-form">
                    <div className="form-group">
                        <label className="label">Status</label>
                        <select
                            className="input"
                            value={statusUpdate.status}
                            onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                            required
                        >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="label">Note (Optional)</label>
                        <textarea
                            className="input"
                            rows="3"
                            value={statusUpdate.note}
                            onChange={(e) => setStatusUpdate({ ...statusUpdate, note: e.target.value })}
                            placeholder="Add a note about this status change..."
                        />
                    </div>

                    {statusUpdate.status === 'resolved' && (
                        <div className="form-group">
                            <label className="label">Resolution Message *</label>
                            <textarea
                                className="input"
                                rows="4"
                                value={statusUpdate.resolutionMessage}
                                onChange={(e) => setStatusUpdate({ ...statusUpdate, resolutionMessage: e.target.value })}
                                required
                                placeholder="Explain how the complaint was resolved..."
                            />
                            <small className="help-text">This message will be visible to the student</small>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={updating}>
                        {updating ? 'Updating...' : 'Update Status'}
                    </button>
                </form>
            </div>

            <div className="card mt-3">
                <h3>Add Note</h3>
                <form onSubmit={handleAddNote} className="note-form">
                    <div className="form-group">
                        <textarea
                            className="input"
                            rows="3"
                            value={newNote.note}
                            onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                            required
                            placeholder="Add a note or update..."
                        />
                    </div>

                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={newNote.isPublic}
                                onChange={(e) => setNewNote({ ...newNote, isPublic: e.target.checked })}
                            />
                            <span>Public (visible to student)</span>
                        </label>
                    </div>

                    <button type="submit" className="btn btn-secondary">Add Note</button>
                </form>
            </div>

            <div className="card mt-3">
                <h3>Complaint History</h3>
                <div className="history-list">
                    {history.map((entry) => (
                        <div key={entry.id} className={`history-item ${!entry.is_public ? 'internal' : ''}`}>
                            <div className="history-item-header">
                                <strong className="action">{entry.action_type.replace(/_/g, ' ').toUpperCase()}</strong>
                                <span className="time">{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                            {entry.note && <p className="note">{entry.note}</p>}
                            <div className="history-meta">
                                <small>by {entry.actor_name}</small>
                                {!entry.is_public && <span className="internal-badge">Internal</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {feedback && (
                <div className="card mt-3 feedback-card">
                    <h3>Student Feedback</h3>
                    <div className="feedback-content">
                        <div className="rating">
                            <strong>Rating:</strong>
                            <span className="stars">{'⭐'.repeat(feedback.rating)}</span>
                            <span>({feedback.rating}/5)</span>
                        </div>
                        {feedback.comments && (
                            <div className="comments">
                                <strong>Comments:</strong>
                                <p>{feedback.comments}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintHandler;
