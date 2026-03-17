const db = require('../config/database');
const aiService = require('./aiService');

const { sendComplaintEscalatedEmail, sendStudentEscalationEmail } = require('./emailService');

/**
 * Checks if a newly created complaint should trigger an escalation
 * based on frequency of similar recent unresolved complaints.
 */
async function checkEscalation(newComplaint) {
    try {
        const { id, category, description, custom_fields } = newComplaint;
        
        // 1. Extract a standardized topic using AI
        const topic = await aiService.extractStandardizedTopic(description, category);
        
        // 2. Save the extracted topic back to the database for future matching
        const updatedCustomFields = { 
            ...(custom_fields || {}), 
            standardized_topic: topic 
        };
        
        await db.query(
            "UPDATE complaints SET custom_fields = $1 WHERE id = $2",
            [updatedCustomFields, id]
        );

        // 3. Look for other complaints with the SAME category AND same standardized_topic
        const query = `
            SELECT c.id, c.title, u.name as student_name, u.email as student_email 
            FROM complaints c
            JOIN users u ON c.student_id = u.id
            WHERE c.category = $1 
            AND c.custom_fields->>'standardized_topic' = $2
            AND c.status IN ('open', 'in_progress')
            AND c.created_at >= NOW() - INTERVAL '2 days'
        `;
        const params = [category, topic];

        const result = await db.query(query, params);

        // 4. If threshold reached (3 or more similar unresolved topics)
        if (result.rowCount >= 3) {
            const complaintIds = result.rows.map(row => row.id);
            
            // Escalate all of them if not already escalated
            await db.query(`
                UPDATE complaints 
                SET is_escalated = true 
                WHERE id = ANY($1::int[]) AND is_escalated = false
            `, [complaintIds]);

            console.log(`[Escalation System] Escalated ${complaintIds.length} complaints for topic: "${topic}"`);

            // 5. Notify Students
            for (const row of result.rows) {
                const student = { name: row.student_name, email: row.student_email };
                const complaint = { id: row.id, title: row.title };
                
                sendStudentEscalationEmail(student, complaint).catch(err => 
                    console.error(`[Escalation System] Failed to notify student ${row.student_email}:`, err)
                );
            }

            // 6. Notify Department Head for this category
            // We find a user with role 'department_head' and matching department name (category name)
            const headResult = await db.query(
                "SELECT email FROM users WHERE role = 'department_head' AND department = $1 LIMIT 1",
                [category]
            );

            if (headResult.rows.length > 0) {
                const headEmail = headResult.rows[0].email;
                for (const row of result.rows) {
                    sendComplaintEscalatedEmail(headEmail, row).catch(err => 
                        console.error(`[Escalation System] Failed to notify Dept Head ${headEmail}:`, err)
                    );
                }
            }
        }
    } catch (error) {
        console.error('[Escalation System] Error checking escalation:', error);
    }
}

module.exports = {
    checkEscalation
};
