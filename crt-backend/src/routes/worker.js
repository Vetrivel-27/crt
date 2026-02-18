const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const aiService = require('../services/aiService');
const {
    updateStatusValidation,
    addNoteValidation,
    idParamValidation,
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication and worker role
router.use(authMiddleware);
router.use(roleCheck(['worker']));

/**
 * GET /api/worker/complaints
 * Get all complaints assigned to the logged-in worker
 */
router.get('/complaints', async (req, res, next) => {
    try {
        const workerId = req.user.id;
        const { status, category, urgency } = req.query;

        let query = `
      SELECT 
        c.*,
        s.name as student_name,
        s.email as student_email,
        s.student_id as student_id
      FROM complaints c
      JOIN users s ON c.student_id = s.id
      WHERE c.assigned_worker_id = $1
    `;
        const params = [workerId];
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

        if (urgency) {
            paramCount++;
            query += ` AND c.urgency = $${paramCount}`;
            params.push(urgency);
        }

        query += ' ORDER BY c.urgency DESC, c.created_at ASC';

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
 * GET /api/worker/stats
 * Get worker dashboard statistics
 */
router.get('/stats', async (req, res, next) => {
    try {
        const workerId = req.user.id;

        // Get counts by status
        const statusResult = await db.query(
            `SELECT status, COUNT(*) as count 
       FROM complaints 
       WHERE assigned_worker_id = $1 
       GROUP BY status`,
            [workerId]
        );

        // Get overdue complaints (open for more than 7 days)
        const overdueResult = await db.query(
            `SELECT COUNT(*) as count 
       FROM complaints 
       WHERE assigned_worker_id = $1 
       AND status IN ('open', 'in_progress')
       AND created_at < NOW() - INTERVAL '7 days'`,
            [workerId]
        );

        // Get average resolution time
        const avgTimeResult = await db.query(
            `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avg_days
       FROM complaints 
       WHERE assigned_worker_id = $1 
       AND status = 'resolved'`,
            [workerId]
        );

        const stats = {
            byStatus: statusResult.rows.reduce((acc, row) => {
                acc[row.status] = parseInt(row.count);
                return acc;
            }, {}),
            overdueCount: parseInt(overdueResult.rows[0].count),
            avgResolutionDays: parseFloat(avgTimeResult.rows[0].avg_days || 0).toFixed(1),
        };

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/worker/complaints/:id
 * Get complaint details (worker can only view assigned complaints)
 */
router.get('/complaints/:id', idParamValidation, async (req, res, next) => {
    try {
        const complaintId = req.params.id;
        const workerId = req.user.id;

        // Get complaint with student info
        const complaintResult = await db.query(
            `SELECT 
        c.*,
        s.name as student_name,
        s.email as student_email,
        s.student_id as student_id
       FROM complaints c
       JOIN users s ON c.student_id = s.id
       WHERE c.id = $1 AND c.assigned_worker_id = $2`,
            [complaintId, workerId]
        );

        if (complaintResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found or not assigned to you',
            });
        }

        const complaint = complaintResult.rows[0];

        // Get full complaint history (including internal notes)
        const historyResult = await db.query(
            `SELECT 
        ch.*,
        u.name as actor_name,
        u.role as actor_role
       FROM complaint_history ch
       LEFT JOIN users u ON ch.actor_user_id = u.id
       WHERE ch.complaint_id = $1
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
            'SELECT * FROM feedback WHERE complaint_id = $1',
            [complaintId]
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
 * PUT /api/worker/complaints/:id/status
 * Update complaint status
 */
router.put('/complaints/:id/status', idParamValidation, updateStatusValidation, async (req, res, next) => {
    try {
        const complaintId = req.params.id;
        const workerId = req.user.id;
        const { status, note, resolutionMessage } = req.body;

        // Verify complaint is assigned to this worker
        const complaintResult = await db.query(
            'SELECT id, status as current_status FROM complaints WHERE id = $1 AND assigned_worker_id = $2',
            [complaintId, workerId]
        );

        if (complaintResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found or not assigned to you',
            });
        }

        const oldStatus = complaintResult.rows[0].current_status;

        // Update complaint status
        const updateQuery = resolutionMessage
            ? 'UPDATE complaints SET status = $1, resolution_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *'
            : 'UPDATE complaints SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';

        const updateParams = resolutionMessage
            ? [status, resolutionMessage, complaintId]
            : [status, complaintId];

        const updateResult = await db.query(updateQuery, updateParams);

        // Log status change in history
        await db.query(
            `INSERT INTO complaint_history (complaint_id, actor_user_id, action_type, old_status, new_status, note, is_public) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [complaintId, workerId, 'status_change', oldStatus, status, note || `Status changed to ${status}`, true]
        );

        // If resolved, log resolution
        if (status === 'resolved' && resolutionMessage) {
            await db.query(
                `INSERT INTO complaint_history (complaint_id, actor_user_id, action_type, note, is_public) 
         VALUES ($1, $2, $3, $4, $5)`,
                [complaintId, workerId, 'resolved', resolutionMessage, true]
            );
        }

        res.json({
            success: true,
            message: 'Complaint status updated successfully',
            data: { complaint: updateResult.rows[0] },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/worker/complaints/:id/notes
 * Add a note to the complaint
 */
router.post('/complaints/:id/notes', idParamValidation, addNoteValidation, async (req, res, next) => {
    try {
        const complaintId = req.params.id;
        const workerId = req.user.id;
        const { note, isPublic } = req.body;

        // Verify complaint is assigned to this worker
        const complaintResult = await db.query(
            'SELECT id FROM complaints WHERE id = $1 AND assigned_worker_id = $2',
            [complaintId, workerId]
        );

        if (complaintResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found or not assigned to you',
            });
        }

        // Add note to history
        const historyResult = await db.query(
            `INSERT INTO complaint_history (complaint_id, actor_user_id, action_type, note, is_public) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [complaintId, workerId, 'note_added', note, isPublic || false]
        );

        res.status(201).json({
            success: true,
            message: 'Note added successfully',
            data: { history: historyResult.rows[0] },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/worker/complaints/:id/reassign
 * Reassign or escalate complaint
 */
router.put('/complaints/:id/reassign', idParamValidation, async (req, res, next) => {
    try {
        const complaintId = req.params.id;
        const workerId = req.user.id;
        const { newWorkerId, reason } = req.body;

        if (!newWorkerId) {
            return res.status(400).json({
                success: false,
                message: 'New worker ID is required',
            });
        }

        // Verify complaint is assigned to this worker
        const complaintResult = await db.query(
            'SELECT id FROM complaints WHERE id = $1 AND assigned_worker_id = $2',
            [complaintId, workerId]
        );

        if (complaintResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found or not assigned to you',
            });
        }

        // Verify new worker exists
        const newWorkerResult = await db.query(
            'SELECT id, name FROM users WHERE id = $1 AND role = $2',
            [newWorkerId, 'worker']
        );

        if (newWorkerResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid worker ID',
            });
        }

        // Update assignment
        await db.query(
            'UPDATE complaints SET assigned_worker_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newWorkerId, complaintId]
        );

        // Log reassignment
        await db.query(
            `INSERT INTO complaint_history (complaint_id, actor_user_id, action_type, note, is_public) 
       VALUES ($1, $2, $3, $4, $5)`,
            [complaintId, workerId, 'reassigned', reason || `Reassigned to ${newWorkerResult.rows[0].name}`, false]
        );

        res.json({
            success: true,
            message: 'Complaint reassigned successfully',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
