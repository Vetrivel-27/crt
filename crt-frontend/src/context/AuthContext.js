import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password, requiredRoles = null) => {
        try {
            const response = await apiService.login({ email, password });
            const { user: userData, token } = response.data.data;

            // Enforce role check if required
            if (requiredRoles) {
                const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
                if (!roles.includes(userData.role)) {
                    return {
                        success: false,
                        message: `Access denied. This login page is for ${roles.join(' and ')} only.`,
                        code: 'WRONG_ROLE',
                        user: userData // Return user so component can still see who tried but don't save to state
                    };
                }
            }

            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', token);
            setUser(userData);

            return { success: true, user: userData };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
                code: error.response?.data?.code || null,
            };
        }
    };

    const register = async (data) => {
        try {
            const response = await apiService.register(data);
            return { success: true, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        apiService.logout().catch(() => { }); // Fire and forget
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
