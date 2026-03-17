const db = require('./src/config/database');
const { initCronJobs } = require('./src/services/cronService');

async function testCron() {
    console.log('--- Setting up test data ---');
    // Ensure student exists
    const [student] = (await db.query(`SELECT id FROM users WHERE role = 'student' LIMIT 1`)).rows;

    const query = `
        INSERT INTO complaints (student_id, title, description, category, urgency, status, created_at)
        VALUES ($1, 'Test Critical Leak', 'The roof is falling down', 'Infrastructure', 'critical', 'open', NOW() - INTERVAL '13 hours')
        RETURNING id
    `;
    
    const result = await db.query(query, [student.id]);
    const cid = result.rows[0].id;
    console.log('Created a 13-hour old critical complaint:', cid);

    console.log('\n--- Triggering Cron Manually ---');
    initCronJobs();
    
    // Instead of waiting for the hour mark, we can just extract the inner logic
    const { sendComplaintEscalatedEmail } = require('./src/services/emailService');
    const HEAD_EMAILS = { 'Maintenance': 'head_maint@crt.edu' };
    
    const testResult = await db.query(`
        SELECT * FROM complaints 
        WHERE urgency = 'critical' 
        AND status IN ('open', 'in_progress')
        AND is_escalated = false
        AND created_at <= NOW() - INTERVAL '12 hours'
    `);
    
    if (testResult.rowCount > 0) {
        console.log(`[Manual Trigger] Found ${testResult.rowCount} critical complaint(s) exceeding 12 hours.`);
        for (const complaint of testResult.rows) {
            await db.query('UPDATE complaints SET is_escalated = true WHERE id = $1', [complaint.id]);
            console.log(`[Manual Trigger] Escalated complaint #${complaint.id}. Emailing head_maint@crt.edu`);
        }
    } else {
        console.log('[Manual Trigger] No records found. Query might be wrong.');
    }
    
    process.exit(0);
}

testCron();
