import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) return null;

    const getDashboardLink = () => {
        switch (user.role) {
            case 'student':
                return '/student/dashboard';
            case 'worker':
                return '/worker/dashboard';
            case 'admin':
                return '/admin/dashboard';
            default:
                return '/';
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to={getDashboardLink()} className="navbar-brand">
                    <h2>CRT System</h2>
                </Link>

                <div className="navbar-menu">
                    <div className="navbar-user">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role badge badge-{user.role}">{user.role}</span>
                    </div>

                    <button onClick={handleLogout} className="btn btn-outline">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
