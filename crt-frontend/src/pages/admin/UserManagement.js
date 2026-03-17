import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import './UserManagement.css';

const DEPARTMENTS = [
    'IT / Technical',
    'Maintenance',
    'Hostel',
    'Academic',
    'Administration',
    'Library',
    'Transport',
    'Other',
];

const EMPTY_FORM = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'worker',
    department: '',
};

const ROLE_DISPLAY = {
    student: 'Student',
    worker: 'Worker',
    department_head: 'Department Head',
    admin: 'Admin',
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            const response = await apiService.getAllUsers(filter);
            setUsers(response.data.data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const validate = () => {
        if (!formData.name.trim() || formData.name.trim().length < 2) {
            return 'Name must be at least 2 characters.';
        }
        if (!formData.email.trim()) {
            return 'Email is required.';
        }
        if (!editingUser) {
            // Creating new user — password required
            if (!formData.password || formData.password.length < 6) {
                return 'Password must be at least 6 characters.';
            }
            if (formData.password !== formData.confirmPassword) {
                return 'Passwords do not match.';
            }
        } else {
            // Editing — if password is filled, validate it
            if (formData.password && formData.password.length < 6) {
                return 'New password must be at least 6 characters.';
            }
            if (formData.password && formData.password !== formData.confirmPassword) {
                return 'Passwords do not match.';
            }
        }
        if (!formData.role) return 'Role is required.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const validationError = validate();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        setSubmitting(true);
        try {
            // Don't send confirmPassword to the API
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                role: formData.role,
                department: formData.department || undefined,
            };
            // Only include password if user typed one
            if (formData.password) {
                payload.password = formData.password;
            }

            if (editingUser) {
                await apiService.updateUser(editingUser.id, payload);
                setSuccessMsg(`✓ "${payload.name}" updated successfully.`);
            } else {
                await apiService.createUser(payload);
                setSuccessMsg(`✓ Worker account for "${payload.name}" created successfully.`);
            }
            await fetchUsers();
            closeModal();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save user. Please try again.';
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (userId, userName) => {
        if (!window.confirm(`Delete "${userName}"? This cannot be undone.`)) return;
        try {
            await apiService.deleteUser(userId);
            setSuccessMsg(`✓ User "${userName}" deleted.`);
            await fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete user.');
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData(EMPTY_FORM);
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            confirmPassword: '',
            role: user.role,
            department: user.department || '',
        });
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormError('');
    };

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        if (formError) setFormError('');
    };

    if (loading) return <LoadingSpinner message="Loading users..." />;

    return (
        <div className="user-management-container">
            <div className="header-section">
                <h1>User Management</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    + Add Worker
                </button>
            </div>

            {successMsg && (
                <div className="success-banner" onClick={() => setSuccessMsg('')}>
                    {successMsg} <span className="dismiss-x">✕</span>
                </div>
            )}

            <div className="filter-section">
                <h3>Filter Users</h3>
                <div className="filter-controls">
                    <button className={`filter-btn ${!filter.role ? 'active' : ''}`} onClick={() => setFilter({})}>
                        All
                    </button>
                    <button className={`filter-btn ${filter.role === 'student' ? 'active' : ''}`} onClick={() => setFilter({ role: 'student' })}>
                        Students
                    </button>
                    <button className={`filter-btn ${filter.role === 'worker' ? 'active' : ''}`} onClick={() => setFilter({ role: 'worker' })}>
                        Workers
                    </button>
                    <button className={`filter-btn ${filter.role === 'department_head' ? 'active' : ''}`} onClick={() => setFilter({ role: 'department_head' })}>
                        Dept. Heads
                    </button>
                    <button className={`filter-btn ${filter.role === 'admin' ? 'active' : ''}`} onClick={() => setFilter({ role: 'admin' })}>
                        Admins
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    {users.length === 0 ? (
                        <p className="empty-state">No users found for this filter.</p>
                    ) : (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Student ID</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>#{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{ROLE_DISPLAY[user.role] || user.role}</td>
                                        <td>{user.department || '-'}</td>
                                        <td>{user.student_id || '-'}</td>
                                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-small btn-secondary" onClick={() => openEditModal(user)}>
                                                    Edit
                                                </button>
                                                <button className="btn-small btn-danger" onClick={() => handleDelete(user.id, user.name)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingUser ? `Edit User — ${editingUser.name}` : 'Add New Worker / Admin'}</h3>

                        {formError && (
                            <div className="form-error-banner">
                                ⚠ {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="form-group">
                                <label className="label">Full Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={handleChange('name')}
                                    placeholder="e.g. Ravi Kumar"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Email *</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    placeholder="e.g. ravi@college.edu"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="label">
                                        Password {editingUser ? '(leave blank to keep current)' : '*'}
                                    </label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={formData.password}
                                        onChange={handleChange('password')}
                                        placeholder={editingUser ? 'New password (optional)' : 'Min. 6 characters'}
                                        required={!editingUser}
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Confirm Password {!editingUser ? '*' : ''}</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={formData.confirmPassword}
                                        onChange={handleChange('confirmPassword')}
                                        placeholder="Re-enter password"
                                        required={!editingUser}
                                        autoComplete="new-password"
                                        disabled={!formData.password && !!editingUser}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="label">Role *</label>
                                    <select
                                        className="input"
                                        value={formData.role}
                                        onChange={handleChange('role')}
                                        required
                                    >
                                        <option value="worker">Worker</option>
                                        <option value="department_head">Department Head</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Department</label>
                                    <select
                                        className="input"
                                        value={formData.department}
                                        onChange={handleChange('department')}
                                    >
                                        <option value="">— Select department —</option>
                                        {DEPARTMENTS.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={submitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting
                                        ? (editingUser ? 'Saving...' : 'Creating...')
                                        : (editingUser ? 'Save Changes' : 'Create Account')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
