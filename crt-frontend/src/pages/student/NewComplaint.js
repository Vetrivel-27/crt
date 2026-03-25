import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import './NewComplaint.css';

const NewComplaint = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        urgency: 'medium',
    });
    const [customFields, setCustomFields] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [correction, setCorrection] = useState(null); // correction notice state
    const [submittedId, setSubmittedId] = useState(null);
    const navigate = useNavigate();

    const categories = [
        'Academic',
        'Hostel & Accommodation',
        'Food & Mess',
        'Library',
        'Transportation',
        'Fees & Finance',
        'Infrastructure',
        'Harassment & Discrimination',
        'Health & Medical',
        'Sports & Extracurricular',
        'General',
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        
        // Reset custom fields if category changes
        if (e.target.name === 'category') {
            setCustomFields({});
        }
        
        setError('');
    };

    const handleCustomFieldChange = (e) => {
        setCustomFields({
            ...customFields,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = { ...formData, customFields };
            const response = await apiService.createComplaint(payload);
            const { correction: corr, complaint } = response.data.data;

            if (corr && corr.corrected) {
                // Show correction notice before navigating
                setCorrection(corr);
                setSubmittedId(complaint.id);
                setLoading(false);
            } else {
                navigate('/student/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit complaint');
            setLoading(false);
        }
    };

    // Correction notice page
    if (correction) {
        return (
            <div className="new-complaint-container">
                <div className="new-complaint-card card">
                    <div className="correction-notice">
                        <h2>Complaint Submitted!</h2>
                        <p className="correction-intro">
                            Your complaint was reviewed, and a small adjustment was made to its category or urgency to ensure
                            it reaches the right team quickly.
                        </p>

                        <div className="correction-changes">
                            {correction.changes.category && (
                                <div className="correction-row">
                                    <span className="correction-label">Category</span>
                                    <span className="correction-from">{correction.changes.category.from}</span>
                                    <span className="correction-arrow">→</span>
                                    <span className="correction-to">{correction.changes.category.to}</span>
                                </div>
                            )}
                            {correction.changes.urgency && (
                                <div className="correction-row">
                                    <span className="correction-label">Urgency</span>
                                    <span className="correction-from">{correction.changes.urgency.from}</span>
                                    <span className="correction-arrow">→</span>
                                    <span className="correction-to correction-urgency">{correction.changes.urgency.to}</span>
                                </div>
                            )}
                        </div>

                        <p className="correction-reason">{correction.reason}</p>

                        <div className="correction-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate(`/student/complaints/${submittedId}`)}
                            >
                                View Complaint
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => navigate('/student/dashboard')}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Complaint form
    return (
        <div className="new-complaint-container">
            <div className="new-complaint-card card">
                <h1>Submit New Complaint</h1>
                <p className="subtitle">Describe your issue and we'll route it to the appropriate department</p>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="complaint-form">
                    <div className="form-group">
                        <label htmlFor="title" className="label">Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="input"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Brief summary of your complaint"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category" className="label">Category *</label>
                        <select
                            id="category"
                            name="category"
                            className="input"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dynamic Fields */}
                    {formData.category === 'Hostel & Accommodation' && (
                        <div className="form-group slide-down">
                            <label htmlFor="hostelBlock" className="label">Hostel Block *</label>
                            <input
                                type="text"
                                id="hostelBlock"
                                name="hostelBlock"
                                className="input"
                                value={customFields.hostelBlock || ''}
                                onChange={handleCustomFieldChange}
                                required
                                placeholder="e.g. A-Block, B-Block"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="urgency" className="label">Urgency *</label>
                        <select
                            id="urgency"
                            name="urgency"
                            className="input"
                            value={formData.urgency}
                            onChange={handleChange}
                            required
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description" className="label">Description *</label>
                        <textarea
                            id="description"
                            name="description"
                            className="input textarea"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows="6"
                            placeholder="Provide detailed information about your complaint..."
                        />
                        <small className="help-text">
                            Minimum 10 characters. Be as specific as possible for faster resolution.
                        </small>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => navigate('/student/dashboard')}
                            className="btn btn-outline"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Complaint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewComplaint;

