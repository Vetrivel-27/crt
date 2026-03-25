const cron = require('node-cron');
const db = require('../config/database');
const { sendComplaintEscalatedEmail } = require('./emailService');

// Map categories to Department Head emails based on earlier assumptions:
const HEAD_EMAILS = {
    'IT / Technical': 'head_it@crt.edu',
    'Maintenance': 'head_maint@crt.edu',
    'Hostel': 'head_hostel@crt.edu',
    'Academic': 'head_academic@crt.edu',
    'Administration': 'head_administration@crt.edu',
    'Library': 'head_library@crt.edu',
    'Transport': 'head_transport@crt.edu',
    'Other': 'head_other@crt.edu'
};

const CATEGORY_TO_DEPARTMENT = {
    'Hostel & Accommodation': 'Hostel',
    'Food & Mess': 'Other',
    'Academic': 'Academic',
    'Library': 'Library',
    'Transportation': 'Transport',
    'Fees & Finance': 'Administration',
    'Harassment & Discrimination': 'Administration',
    'Infrastructure': 'Maintenance',
    'Health & Medical': 'Other',
    'Sports & Extracurricular': 'Other',
    'General': 'Other',
};

// Initializes all background jobs.
function initCronJobs() {
    console.log('[Cron] Initializing background jobs...');
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('[Cron] Running critical escalation check...');
        try {
            // Find all CRITICAL complaints that are open/in-progress,
            // haven't been escalated yet, and are older than 12 hours.
            const query = `
                SELECT * FROM complaints 
                WHERE urgency = 'critical' 
                AND status IN ('open', 'in_progress')
                AND is_escalated = false
                AND created_at <= NOW() - INTERVAL '12 hours'
            `;
            const result = await db.query(query);
            if (result.rowCount > 0) {
                console.log(`[Cron] Found ${result.rowCount} critical complaint(s) exceeding 12 hours.`);
                for (const complaint of result.rows) {
                    // Update the DB immediately
                    await db.query(
                        'UPDATE complaints SET is_escalated = true WHERE id = $1',
                        [complaint.id]
                    );
                    // Determine recipient
                    const mappedDept = CATEGORY_TO_DEPARTMENT[complaint.category] || 'Other';
                    const headEmail = HEAD_EMAILS[mappedDept] || 'admin@crt.edu'; // fallback to general admin
                    console.log(`[Cron] Escalated complaint #${complaint.id}. Emailing ${headEmail}`);
                    // Send Email Notification
                    sendComplaintEscalatedEmail(headEmail, complaint).catch(err => {
                        console.error(`[Cron] Failed to email Department Head for complaint #${complaint.id}`, err);
                    });
                }
            } else {
                console.log('[Cron] No new critical complaints required escalation.');
            }
        } catch (error) {
            console.error('[Cron] Error running critical escalation check:', error);
        }
    });
}

module.exports = { initCronJobs };
