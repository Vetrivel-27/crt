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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
        'General',
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await apiService.createComplaint(formData);
            navigate('/student/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit complaint');
            setLoading(false);
        }
    };

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
