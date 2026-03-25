const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const jwtConfig = require('../config/jwt');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { sendVerificationEmail } = require('../services/emailService');

const router = express.Router();

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Helper: token expiry — 24 hours from now
function tokenExpiry() {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

/**
 * POST /auth/register
 * Register a new student user. Sends a verification email before they can log in.
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

        // Generate verification token
        const token = generateToken();
        const expires = tokenExpiry();

        // Insert new user (not yet verified)
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, role, student_id, email_verified, verification_token, token_expires_at) 
       VALUES ($1, $2, $3, $4, $5, false, $6, $7) 
       RETURNING id, name, email, role, student_id, created_at`,
            [name, email, passwordHash, 'student', studentId, token, expires]
        );

        const user = result.rows[0];

        // Send verification email
        try {
            await sendVerificationEmail(user, token);
        } catch (emailErr) {
            console.error('Failed to send verification email:', emailErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account before logging in.',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    studentId: user.student_id,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /auth/verify-email?token=xxx
 * Verify a user's email using the token from their email link.
 */
router.get('/verify-email', async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Verification token is required.' });
        }

        // Find user with this token
        const result = await db.query(
            'SELECT id, email, email_verified, token_expires_at FROM users WHERE verification_token = $1',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid verification link.' });
        }

        const user = result.rows[0];

        if (user.email_verified) {
            return res.json({ success: true, message: 'Email already verified. You can log in.' });
        }

        if (new Date() > new Date(user.token_expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'This verification link has expired. Please request a new one.',
                code: 'TOKEN_EXPIRED',
            });
        }

        // Mark as verified. We "expires" via token_expires_at anyway.
        await db.query(
            'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /auth/resend-verification
 * Resend the verification email for a student account.
 */
router.post('/resend-verification', async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        const result = await db.query(
            'SELECT id, name, email, email_verified, role FROM users WHERE email = $1',
            [email]
        );
        const genericOk = { success: true, message: 'If that email is registered and unverified, a new link has been sent.' };

        if (result.rows.length === 0) return res.json(genericOk);

        const user = result.rows[0];
        if (user.email_verified) return res.json(genericOk);

        // Generate a fresh token
        const token = generateToken();
        const expires = tokenExpiry();

        await db.query(
            'UPDATE users SET verification_token = $1, token_expires_at = $2 WHERE id = $3',
            [token, expires, user.id]
        );

        try {
            await sendVerificationEmail(user, token);
        } catch (emailErr) {
            console.error('Failed to resend verification email:', emailErr.message);
        }

        res.json(genericOk);
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
            'SELECT id, name, email, password_hash, role, department, student_id, email_verified FROM users WHERE email = $1 OR student_id = $1',
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

        // Block login if email not verified
        if (!user.email_verified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address before logging in.',
                code: 'EMAIL_NOT_VERIFIED',
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
 * Logout (client-side token removal)
 */
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logout successful' });
});

module.exports = router;
