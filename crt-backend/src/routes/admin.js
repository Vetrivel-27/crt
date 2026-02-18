const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const aiService = require('../services/aiService');
const {
    createUserValidation,
    idParamValidation,
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleCheck(['admin']));

/**
 * GET /api/admin/overview
 * Get admin dashboard overview with analytics
 */
router.get('/overview', async (req, res, next) => {
    try {
        // Get total counts
        const totalComplaintsResult = await db.query('SELECT COUNT(*) as count FROM complaints');
        const totalUsersResult = await db.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['student']);
        const totalWorkersResult = await db.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['worker']);

        // Get complaints by status
        const byStatusResult = await db.query(
            `SELECT status, COUNT(*) as count FROM complaints GROUP BY status`
        );

        // Get complaints by category
        const byCategoryResult = await db.query(
            `SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC LIMIT 10`
        );

        // Get complaints by urgency
        const byUrgencyResult = await db.query(
            `SELECT urgency, COUNT(*) as count FROM complaints GROUP BY urgency`
        );

        // Get resolution rate
        const resolvedResult = await db.query(
            `SELECT COUNT(*) as count FROM complaints WHERE status IN ('resolved', 'closed')`
        );

        const totalComplaints = parseInt(totalComplaintsResult.rows[0].count);
        const resolvedCount = parseInt(resolvedResult.rows[0].count);
        const resolutionRate = totalComplaints > 0 ? ((resolvedCount / totalComplaints) * 100).toFixed(1) : 0;

        // Get average resolution time
        const avgTimeResult = await db.query(
            `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avg_days
       FROM complaints 
       WHERE status IN ('resolved', 'closed')`
        );

        // Get recent complaints
        const recentResult = await db.query(
            `SELECT 
        c.id, c.title, c.category, c.status, c.urgency, c.created_at,
        s.name as student_name,
        w.name as worker_name
       FROM complaints c
       JOIN users s ON c.student_id = s.id
       LEFT JOIN users w ON c.assigned_worker_id = w.id
       ORDER BY c.created_at DESC
       LIMIT 10`
        );

        // Get all complaints for AI analytics
        const allComplaintsResult = await db.query(
            'SELECT id, title, category, status, urgency, created_at, updated_at FROM complaints'
        );

        // Generate AI insights
        const aiAnalytics = await aiService.generateAnalytics(allComplaintsResult.rows);

        const overview = {
            totalComplaints,
            totalStudents: parseInt(totalUsersResult.rows[0].count),
            totalWorkers: parseInt(totalWorkersResult.rows[0].count),
            resolutionRate: parseFloat(resolutionRate),
            avgResolutionDays: parseFloat(avgTimeResult.rows[0].avg_days || 0).toFixed(1),
            byStatus: byStatusResult.rows.reduce((acc, row) => {
                acc[row.status] = parseInt(row.count);
                return acc;
            }, {}),
            byCategory: byCategoryResult.rows.map(row => ({
                category: row.category,
                count: parseInt(row.count),
            })),
            byUrgency: byUrgencyResult.rows.reduce((acc, row) => {
                acc[row.urgency] = parseInt(row.count);
                return acc;
            }, {}),
            recentComplaints: recentResult.rows,
            aiInsights: aiAnalytics.insights,
            aiTrends: aiAnalytics.trends,
            aiRecommendations: aiAnalytics.recommendations,
        };

        res.json({
            success: true,
            data: overview,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/complaints
 * Get all complaints with filters
 */
router.get('/complaints', async (req, res, next) => {
    try {
        const { status, category, urgency, workerId, search } = req.query;

        let query = `
      SELECT 
        c.*,
        s.name as student_name,
        s.email as student_email,
        s.student_id,
        w.name as worker_name,
        w.department as worker_department
      FROM complaints c
      JOIN users s ON c.student_id = s.id
      LEFT JOIN users w ON c.assigned_worker_id = w.id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND c.status = $${paramCount}`;
            params.push(status);
        }

        if (category) {
            paramCount++;
            query += ` AND c.category = $${paramCount}`;
            params.push(category);
        }

        if (urgency) {
            paramCount++;
            query += ` AND c.urgency = $${paramCount}`;
            params.push(urgency);
        }

        if (workerId) {
            paramCount++;
            query += ` AND c.assigned_worker_id = $${paramCount}`;
            params.push(workerId);
        }

        if (search) {
            paramCount++;
            query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += ' ORDER BY c.created_at DESC';

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: {
                complaints: result.rows,
                count: result.rows.length,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/admin/complaints/:id/assign
 * Assign or reassign a complaint to a worker
 */
router.put('/complaints/:id/assign', idParamValidation, async (req, res, next) => {
    try {
        const complaintId = req.params.id;
        const { workerId, department } = req.body;

        // Verify complaint exists
        const complaintResult = await db.query(
            'SELECT id, assigned_worker_id FROM complaints WHERE id = $1',
            [complaintId]
        );

        if (complaintResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found',
            });
        }

        const oldWorkerId = complaintResult.rows[0].assigned_worker_id;

        // If workerId provided, verify worker exists
        if (workerId) {
            const workerResult = await db.query(
                'SELECT id, name FROM users WHERE id = $1 AND role = $2',
                [workerId, 'worker']
            );

            if (workerResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid worker ID',
                });
            }
        }

        // Update assignment
        await db.query(
            'UPDATE complaints SET assigned_worker_id = $1, assigned_department = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [workerId || null, department || null, complaintId]
        );

        // Log assignment change
        const actionType = oldWorkerId ? 'reassigned' : 'assigned';
        await db.query(
            `INSERT INTO complaint_history (complaint_id, actor_user_id, action_type, note, is_public) 
       VALUES ($1, $2, $3, $4, $5)`,
            [complaintId, req.user.id, actionType, `Admin ${actionType} complaint`, false]
        );

        res.json({
            success: true,
            message: 'Complaint assigned successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/users
 * Get all users with filters
 */
router.get('/users', async (req, res, next) => {
    try {
        const { role, department } = req.query;

        let query = 'SELECT id, name, email, role, department, student_id, created_at FROM users WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (role) {
            paramCount++;
            query += ` AND role = $${paramCount}`;
            params.push(role);
        }

        if (department) {
            paramCount++;
            query += ` AND department = $${paramCount}`;
            params.push(department);
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: {
                users: result.rows,
                count: result.rows.length,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/users
 * Create a new user (worker or admin)
 */
router.post('/users', createUserValidation, async (req, res, next) => {
    try {
        const { name, email, password, role, department, studentId } = req.body;

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists',
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, role, department, student_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, role, department, student_id, created_at`,
            [name, email, passwordHash, role, department || null, studentId || null]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user: result.rows[0] },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/admin/users/:id
 * Update user details
 */
router.put('/users/:id', idParamValidation, async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { name, email, role, department } = req.body;

        // Check if user exists
        const userResult = await db.query('SELECT id FROM users WHERE id = $1', [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Update user
        const result = await db.query(
            `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           role = COALESCE($3, role), 
           department = COALESCE($4, department),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, email, role, department, student_id, updated_at`,
            [name, email, role, department, userId]
        );

        res.json({
            success: true,
            message: 'User updated successfully',
            data: { user: result.rows[0] },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete('/users/:id', idParamValidation, async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Prevent deleting self
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account',
            });
        }

        // Delete user
        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
