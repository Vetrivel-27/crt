import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import './ComplaintDetail.css';

const ComplaintDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ rating: 5, comments: '' });
    const [showFeedback, setShowFeedback] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        fetchComplaintDetails();
    }, [id]);

    const fetchComplaintDetails = async () => {
        try {
            const response = await apiService.getComplaintDetails(id);
            setData(response.data.data);
            setShowFeedback(
                (response.data.data.complaint.status === 'resolved' ||
                    response.data.data.complaint.status === 'closed') &&
                !response.data.data.feedback
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        setSubmittingFeedback(true);
        try {
            await apiService.submitFeedback(id, feedback);
            await fetchComplaintDetails();
            setShowFeedback(false);
        } catch (err) {
            console.error(err);
            alert('Failed to submit feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading complaint details..." />;
    if (!data) return <div className="container mt-4">Complaint not found</div>;

    const { complaint, history, feedback: existingFeedback } = data;

    return (
        <div className="complaint-detail-container">
            <button onClick={() => navigate('/student/dashboard')} className="btn btn-outline mb-3">
                ← Back to Dashboard
            </button>

            <div className="card">
                <div className="complaint-detail-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        {complaint.is_escalated && (
                            <span className="badge badge-error" style={{ background: '#dc3545', color: 'white' }}>ESCALATED</span>
                        )}
                        <h1>{complaint.title}</h1>
                    </div>
                    <StatusBadge status={complaint.status} />
                </div>

                {complaint.is_escalated && (
                    <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)', color: '#c53030' }}>
                        <strong>Priority Escalation:</strong> This issue has been automatically escalated because multiple similar reports were detected. Our department heads are prioritizing this resolution.
                    </div>
                )}

                {/* Auto-correction banner */}
                {complaint.auto_corrected && (
                    <div className="auto-correction-banner">
                        {/* <span className="auto-correction-icon">🤖</span> */}
                        <div className="auto-correction-content">
                            <strong>Automatically Adjusted</strong>
                            <p>Some details were adjusted to better categorise your complaint.</p>
                            <div className="correction-comparison">
                                {complaint.student_selected_category && complaint.student_selected_category !== complaint.category && (
                                    <div className="comparison-row">
                                        <span className="comparison-field">Category:</span>
                                        <span className="comparison-original">{complaint.student_selected_category}</span>
                                        <span className="comparison-arrow">→</span>
                                        <span className="comparison-corrected">{complaint.category}</span>
                                    </div>
                                )}
                                {complaint.student_selected_urgency && complaint.student_selected_urgency !== complaint.urgency && (
                                    <div className="comparison-row">
                                        <span className="comparison-field">Urgency:</span>
                                        <span className="comparison-original">{complaint.student_selected_urgency}</span>
                                        <span className="comparison-arrow">→</span>
                                        <span className="comparison-corrected">{complaint.urgency}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="complaint-meta-grid">
                    <div className="meta-item">
                        <strong>Category:</strong>
                        <span className="category-badge">{complaint.category}</span>
                    </div>
                    {complaint.custom_fields?.hostelBlock && (
                        <div className="meta-item">
                            <strong>Hostel Block:</strong>
                            <span>{complaint.custom_fields.hostelBlock}</span>
                        </div>
                    )}
                    <div className="meta-item">
                        <strong>Urgency:</strong>
                        <span className={`badge badge-${complaint.urgency}`}>{complaint.urgency}</span>
                    </div>
                    <div className="meta-item">
                        <strong>Created:</strong>
                        <span>{new Date(complaint.created_at).toLocaleString()}</span>
                    </div>
                    <div className="meta-item">
                        <strong>Last Updated:</strong>
                        <span>{new Date(complaint.updated_at).toLocaleString()}</span>
                    </div>
                </div>

                <div className="complaint-section">
                    <h3>Description</h3>
                    <p className="description-text">{complaint.description}</p>
                </div>

                {complaint.ai_summary && (
                    <div className="ai-summary-box">
                        <h4>Complaint Summary</h4>
                        <p>{complaint.ai_summary}</p>
                    </div>
                )}

                {complaint.assigned_worker_name && (
                    <div className="complaint-section">
                        <h3>Assignment</h3>
                        <p>
                            <strong>Assigned to:</strong> {complaint.assigned_worker_name}
                            {complaint.worker_department && ` (${complaint.worker_department})`}
                        </p>
                    </div>
                )}

                {complaint.resolution_message && (
                    <div className="resolution-box">
                        <h4>Resolution</h4>
                        <p>{complaint.resolution_message}</p>
                    </div>
                )}
            </div>


            <div className="card mt-3">
                <h3>Complaint History</h3>
                <div className="history-timeline">
                    {history.map((entry) => (
                        <div key={entry.id} className="history-entry">
                            <div className="history-header">
                                <strong className="action-type">
                                    {entry.action_type.replace(/_/g, ' ').toUpperCase()}
                                </strong>
                                <span className="timestamp">
                                    {new Date(entry.timestamp).toLocaleString()}
                                </span>
                            </div>
                            {entry.note && <p className="history-note">{entry.note}</p>}
                            {entry.actor_name && (
                                <small className="actor-info">by {entry.actor_name}</small>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {showFeedback && (
                <div className="card mt-3">
                    <h3>Submit Feedback</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                        How satisfied are you with the resolution?
                    </p>
                    <form onSubmit={handleFeedbackSubmit}>
                        <div className="form-group">
                            <label className="label">Rating</label>
                            <select
                                className="input"
                                value={feedback.rating}
                                onChange={(e) => setFeedback({ ...feedback, rating: parseInt(e.target.value) })}
                            >
                                {[5, 4, 3, 2, 1].map((n) => (
                                    <option key={n} value={n}>
                                        {n} Star{n > 1 ? 's' : ''} {n === 5 ? '(Excellent)' : n === 4 ? '(Good)' : n === 3 ? '(Average)' : n === 2 ? '(Poor)' : '(Very Poor)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Comments (Optional)</label>
                            <textarea
                                className="input"
                                rows="4"
                                value={feedback.comments}
                                onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                                placeholder="Share your experience..."
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submittingFeedback}>
                            {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </form>
                </div>
            )}

            {existingFeedback && (
                <div className="card mt-3 feedback-display">
                    <h3>Your Feedback</h3>
                    <div className="rating-display">
                        <strong>Rating:</strong>
                        <span className="stars">{'⭐'.repeat(existingFeedback.rating)}</span>
                        <span>({existingFeedback.rating}/5)</span>
                    </div>
                    {existingFeedback.comments && (
                        <div className="feedback-comments">
                            <strong>Comments:</strong>
                            <p>{existingFeedback.comments}</p>
                        </div>
                    )}
                    <small style={{ color: 'var(--text-tertiary)' }}>
                        Submitted on {new Date(existingFeedback.created_at).toLocaleString()}
                    </small>
                </div>
            )}
        </div>
    );
};

export default ComplaintDetail;
