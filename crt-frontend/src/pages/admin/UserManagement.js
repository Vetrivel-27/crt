import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'worker',
        department: '',
    });

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const fetchUsers = async () => {
        try {
            const response = await apiService.getAllUsers(filter);
            setUsers(response.data.data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await apiService.updateUser(editingUser.id, formData);
                alert('User updated successfully!');
            } else {
                await apiService.createUser(formData);
                alert('User created successfully!');
            }
            await fetchUsers();
            closeModal();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to save user');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await apiService.deleteUser(userId);
            await fetchUsers();
            alert('User deleted successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to delete user');
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'worker', department: '' });
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            department: user.department || '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    if (loading) return <LoadingSpinner message="Loading users..." />;

    return (
        <div className="user-management-container">
            <div className="header-section">
                <h1>User Management</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    + Create User
                </button>
            </div>

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
                    <button className={`filter-btn ${filter.role === 'admin' ? 'active' : ''}`} onClick={() => setFilter({ role: 'admin' })}>
                        Admins
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
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
                                    <td><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                                    <td>{user.department || '-'}</td>
                                    <td>{user.student_id || '-'}</td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-small btn-secondary" onClick={() => openEditModal(user)}>
                                                Edit
                                            </button>
                                            <button className="btn-small btn-danger" onClick={() => handleDelete(user.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="label">Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Email *</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Password {editingUser ? '(leave blank to keep current)' : '*'}</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Role *</label>
                                <select
                                    className="input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    required
                                >
                                    <option value="student">Student</option>
                                    <option value="worker">Worker</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Department</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUser ? 'Update' : 'Create'}
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
