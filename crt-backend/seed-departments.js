require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function seedDepartments() {
    try {
        console.log('Starting department seeding process...');

        // 1. Delete the old test worker
        await pool.query("DELETE FROM users WHERE email = 'worker@crt.edu'");
        console.log('Deleted old test worker (worker@crt.edu)');

        const passwordHash = await bcrypt.hash('worker123', 10);

        // 2. Department configurations
        const departments = [
            {
                name: 'IT Support',
                head: { name: 'IT Head', email: 'head_it@crt.edu' },
                workers: [{ name: 'IT1', email: 'it1@crt.edu' }, { name: 'IT2', email: 'it2@crt.edu' }]
            },
            {
                name: 'Maintenance',
                head: { name: 'Maintenance Head', email: 'head_maint@crt.edu' },
                workers: [{ name: 'Maint1', email: 'maint1@crt.edu' }, { name: 'Maint2', email: 'maint2@crt.edu' }]
            },
            {
                name: 'Hostel Management',
                head: { name: 'Hostel Head', email: 'head_hostel@crt.edu' },
                workers: [{ name: 'Hostel1', email: 'hostel1@crt.edu' }, { name: 'Hostel2', email: 'hostel2@crt.edu' }]
            },
            {
                name: 'Academic Affairs',
                head: { name: 'Academic Head', email: 'head_academic@crt.edu' },
                workers: [{ name: 'Academic1', email: 'academic1@crt.edu' }, { name: 'Academic2', email: 'academic2@crt.edu' }]
            },
            {
                name: 'Administration',
                head: { name: 'Admin Head', email: 'head_administration@crt.edu' },
                workers: [{ name: 'AdminWorker1', email: 'adminw1@crt.edu' }]
            },
            {
                name: 'Library',
                head: { name: 'Library Head', email: 'head_library@crt.edu' },
                workers: [{ name: 'Lib1', email: 'lib1@crt.edu' }]
            },
            {
                name: 'Transport',
                head: { name: 'Transport Head', email: 'head_transport@crt.edu' },
                workers: [{ name: 'Transport1', email: 'transport1@crt.edu' }]
            },
            {
                name: 'Medical Centre',
                head: { name: 'Medical Head', email: 'head_medical@crt.edu' },
                workers: [{ name: 'Nurse1', email: 'nurse1@crt.edu' }, { name: 'Doctor1', email: 'doctor1@crt.edu' }]
            },
            {
                name: 'Mess Committee',
                head: { name: 'Mess Head', email: 'head_mess@crt.edu' },
                workers: [{ name: 'MessW1', email: 'messw1@crt.edu' }]
            },
            {
                name: 'Student Welfare',
                head: { name: 'Welfare Head', email: 'head_welfare@crt.edu' },
                workers: [{ name: 'WelfareW1', email: 'welfare1@crt.edu' }]
            },
            {
                name: 'Other',
                head: { name: 'General Head', email: 'head_other@crt.edu' },
                workers: [{ name: 'General1', email: 'general1@crt.edu' }]
            }
        ];

        // 3. Insert users
        for (const dept of departments) {
            // Insert Head
            await pool.query(`
                INSERT INTO users (name, email, password_hash, role, department, email_verified)
                VALUES ($1, $2, $3, 'department_head', $4, true)
                ON CONFLICT (email) DO NOTHING
            `, [dept.head.name, dept.head.email, passwordHash, dept.name]);
            console.log(`Created Department Head: ${dept.head.email} (${dept.name})`);

            // Insert Workers
            for (const worker of dept.workers) {
                await pool.query(`
                    INSERT INTO users (name, email, password_hash, role, department, email_verified)
                    VALUES ($1, $2, $3, 'worker', $4, true)
                    ON CONFLICT (email) DO NOTHING
                `, [worker.name, worker.email, passwordHash, dept.name]);
                console.log(`Created Worker: ${worker.email} (${dept.name})`);
            }
        }

        console.log('\nSeeding completed successfully!');
        console.log('All new accounts use password: worker123');

    } catch (e) {
        console.error('Error seeding departments:', e);
    } finally {
        await pool.end();
    }
}

seedDepartments();
