const db = require('./src/config/database');
const crypto = require('crypto');

async function testVerificationLogic() {
    try {
        console.log('--- Simulating Verification ---');
        
        // 1. Create a fake user with a fresh token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        const insertQuery = `
            INSERT INTO users (name, email, password_hash, role, student_id, email_verified, verification_token, token_expires_at) 
            VALUES ($1, $2, $3, $4, $5, false, $6, $7) 
            RETURNING id
        `;
        const result = await db.query(insertQuery, ['Test User', 'test.verify@crt.edu', 'hash', 'student', 'TEST999', token, expires]);
        const testUserId = result.rows[0].id;
        console.log(`Created fake unverified user #${testUserId} with token ${token.substring(0,6)}...`);

        // 2. Simulate First Click (The security scanner)
        console.log('\n--- First Click (Security Scanner) ---');
        let check1 = await db.query('SELECT id, email, email_verified, token_expires_at FROM users WHERE verification_token = $1', [token]);
        if (check1.rows.length === 0) console.log('Check 1: Failed! (Token not found)');
        else {
            const u = check1.rows[0];
            if (u.email_verified) console.log('Check 1: Successfully handled "Already Verified"');
            else {
                await db.query('UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [u.id]);
                console.log('Check 1: Successfully Marked as Verified and Kept Token.');
            }
        }

        // 3. Simulate Second Click (The user clicking the email half a second later)
        console.log('\n--- Second Click (Actual User) ---');
        let check2 = await db.query('SELECT id, email, email_verified, token_expires_at FROM users WHERE verification_token = $1', [token]);
        if (check2.rows.length === 0) console.log('Check 2: Failed! (Token not found. This is where the Invalid Link happens!)');
        else {
             const u = check2.rows[0];
             if (u.email_verified) console.log('Check 2: SUCCESSFULLY handled "Already Verified". Link works perfectly.');
             else console.log('Check 2: Marked verified again?');
        }

        // Cleanup
        await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
        console.log('\nCleanup complete.');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testVerificationLogic();
