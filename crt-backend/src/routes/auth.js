const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const jwtConfig = require('../config/jwt');
const { registerValidation, loginValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /auth/register
 * Register a new student user
 */
router.post('/register', registerValidation, async (req, res, next) => {
    try {
        const { name, email, password, studentId } = req.body;

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1 OR student_id = $2',
            [email, studentId]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or student ID already exists',
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, role, student_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, role, student_id, created_at`,
            [name, email, passwordHash, 'student', studentId]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    studentId: user.student_id,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /auth/login
 * Login for all user types (student, worker, admin)
 */
router.post('/login', loginValidation, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user by email OR student_id
        const result = await db.query(
            'SELECT id, name, email, password_hash, role, department, student_id FROM users WHERE email = $1 OR student_id = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    studentId: user.student_id,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /auth/logout
 * Logout (mainly client-side token removal, but can be extended for token blacklisting)
 */
router.post('/logout', (req, res) => {
    // In a stateless JWT setup, logout is primarily handled client-side
    // This endpoint can be extended to implement token blacklisting if needed
    res.json({
        success: true,
        message: 'Logout successful',
    });
});

module.exports = router;
