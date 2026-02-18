const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const aiService = require('../services/aiService');
const {
    createComplaintValidation,
    feedbackValidation,
    idParamValidation,
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication and student role
router.use(authMiddleware);
router.use(roleCheck(['student']));

/**
 * GET /api/student/complaints
 * Get all complaints for the logged-in student
 */
router.get('/complaints', async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { status, category } = req.query;

        let query = `
      SELECT 
        c.*,
        u.name as assigned_worker_name,
        u.department as worker_department
      FROM complaints c
      LEFT JOIN users u ON c.assigned_worker_id = u.id
      WHERE c.student_id = $1
    `;
        const params = [studentId];
        let paramCount = 1;

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
 * POST /api/complaints
 * Create a new complaint (student only)
 */
router.post('/complaints', createComplaintValidation, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { title, description, category, urgency } = req.body;

        // Use AI to classify the complaint if urgency not provided
        let finalUrgency = urgency || 'medium';
        let finalCategory = category;

        if (!urgency || !category) {
            const classification = await aiService.classifyComplaint(description, { title });
            if (!category) finalCategory = classification.category;
            if (!urgency) finalUrgency = classification.urgency;
        }

        // Insert complaint
        const insertResult = await db.query(
            `INSERT INTO complaints (student_id, title, description, category, urgency, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
            [studentId, title, description, finalCategory, finalUrgency, 'open']
        );

        const complaint = insertResult.rows[0];

        // Log complaint creation in history
        await db.query(
            `INSERT INTO complaint_history (complaint_id, actor_user_id, action_type, new_status, note) 
       VALUES ($1, $2, $3, $4, $5)`,
            [complaint.id, studentId, 'created', 'open', 'Complaint created']
        );

        // Get available workers for routing
        const workersResult = await db.query(
            `SELECT id, name, department FROM users WHERE role = 'worker'`
        );

        // Use AI to suggest routing
        const routing = await aiService.suggestRouting(complaint, workersResult.rows);

        // Update complaint with assignment if worker suggested
        if (routing.workerId) {
            await db.query(
                `UPDATE complaints 
         SET assigned_worker_id = $1, assigned_department = $2 
         WHERE id = $3`,
                [routing.workerId, routing.department, complaint.id]
            );

            // Log assignment
            await db.query(
                `INSERT INTO complaint_history (complaint_id, actor_user_id, action_type, note) 
         VALUES ($1, $2, $3, $4)`,
                [complaint.id, studentId, 'assigned', routing.reason]
            );

            complaint.assigned_worker_id = routing.workerId;
            complaint.assigned_department = routing.department;
        } else if (routing.department) {
            await db.query(
                `UPDATE complaints SET assigned_department = $1 WHERE id = $2`,
                [routing.department, complaint.id]
            );
            complaint.assigned_department = routing.department;
        }

        res.status(201).json({
            success: true,
            message: 'Complaint created successfully',
            data: { complaint },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/complaints/:id
 * Get complaint details (student can only view their own)
 */
router.get('/complaints/:id', idParamValidation, async (req, res, next) => {
    try {
        const complaintId = req.params.id;
        const studentId = req.user.id;

        // Get complaint with worker info
        const complaintResult = await db.query(
            `SELECT 
        c.*,
        u.name as assigned_worker_name,
        u.email as assigned_worker_email,
        u.department as worker_department
       FROM complaints c
       LEFT JOIN users u ON c.assigned_worker_id = u.id
       WHERE c.id = $1 AND c.student_id = $2`,
            [complaintId, studentId]
        );

        if (complaintResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found or access denied',
            });
        }

        const complaint = complaintResult.rows[0];

        // Get complaint history (only public notes for students)
        const historyResult = await db.query(
            `SELECT 
        ch.*,
        u.name as actor_name,
        u.role as actor_role
       FROM complaint_history ch
       LEFT JOIN users u ON ch.actor_user_id = u.id
       WHERE ch.complaint_id = $1 AND (ch.is_public = true OR ch.action_type IN ('created', 'status_change', 'assigned'))
       ORDER BY ch.timestamp ASC`,
            [complaintId]
        );

        // Generate AI summary if not exists
        if (!complaint.ai_summary) {
            const summary = await aiService.generateSummary(complaint, historyResult.rows);
            await db.query(
                'UPDATE complaints SET ai_summary = $1 WHERE id = $2',
                [summary, complaintId]
            );
            complaint.ai_summary = summary;
        }

        // Get feedback if exists
        const feedbackResult = await db.query(
            'SELECT * FROM feedback WHERE complaint_id = $1 AND student_id = $2',
            [complaintId, studentId]
        );

        res.json({
            success: true,
            data: {
                complaint,
                history: historyResult.rows,
                feedback: feedbackResult.rows[0] || null,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/complaints/:id/feedback
 * Submit feedback for a resolved complaint
 */
router.post('/complaints/:id/feedback', idParamValidation, feedbackValidation, async (req, res, next) => {
    try {
        const complaintId = req.params.id;
        const studentId = req.user.id;
        const { rating, comments } = req.body;

        // Check if complaint exists and belongs to student
        const complaintResult = await db.query(
            'SELECT id, status, student_id FROM complaints WHERE id = $1',
            [complaintId]
        );

        if (complaintResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found',
            });
        }

        const complaint = complaintResult.rows[0];

        if (complaint.student_id !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        if (complaint.status !== 'resolved' && complaint.status !== 'closed') {
            return res.status(400).json({
                success: false,
                message: 'Feedback can only be submitted for resolved or closed complaints',
            });
        }

        // Insert or update feedback
        const feedbackResult = await db.query(
            `INSERT INTO feedback (complaint_id, student_id, rating, comments) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (complaint_id, student_id) 
       DO UPDATE SET rating = $3, comments = $4, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
            [complaintId, studentId, rating, comments]
        );

        // Log feedback in history
        await db.query(
            `INSERT INTO complaint_history (complaint_id, actor_user_id, action_type, note, is_public) 
       VALUES ($1, $2, $3, $4, $5)`,
            [complaintId, studentId, 'feedback_added', `Rated ${rating}/5`, true]
        );

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: { feedback: feedbackResult.rows[0] },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
