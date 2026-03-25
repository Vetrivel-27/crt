const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM = process.env.SMTP_FROM || `CRT System <${process.env.SMTP_USER}>`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Send email verification link to a newly self-registered student.
 * The student CANNOT log in until they click this link.
 */
async function sendVerificationEmail(user, token) {
    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: FROM,
        to: user.email,
        subject: 'Verify your CRT account',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #6b4e2a;">Welcome to the Complaint Resolution Tracker!</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Thanks for registering. Please click the button below to verify your email address and activate your account.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${verifyUrl}"
                   style="background: #6b4e2a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                    Verify My Email
                </a>
            </div>
            <p style="color: #888; font-size: 14px;">This link expires in <strong>24 hours</strong>.</p>
            <p style="color: #888; font-size: 14px;">If you didn't register for CRT, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">Complaint Resolution Tracker &mdash; ${FRONTEND_URL}</p>
        </div>`,
    });
}

/**
 * Send a welcome + credentials email to a worker/admin created by the admin.
 * These accounts are pre-verified, so no gate — this is just informational.
 */
async function sendWorkerWelcomeEmail(user, creatorName) {
    const loginUrl = `${FRONTEND_URL}/login`;
    await transporter.sendMail({
        from: FROM,
        to: user.email,
        subject: 'Your CRT staff account has been created',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #4a5f3e;">Your CRT Staff Account is Ready</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>An administrator (<strong>${creatorName}</strong>) has created a staff account for you on the Complaint Resolution Tracker.</p>
            <table style="background: #f9f9f9; border-radius: 6px; padding: 16px; width: 100%; margin: 16px 0;">
                <tr><td style="color: #888; padding: 4px 0;">Email</td><td><strong>${user.email}</strong></td></tr>
                <tr><td style="color: #888; padding: 4px 0;">Role</td><td><strong style="text-transform: capitalize;">${user.role}</strong></td></tr>
                ${user.department ? `<tr><td style="color: #888; padding: 4px 0;">Department</td><td><strong>${user.department}</strong></td></tr>` : ''}
            </table>
            <p>Your password was set by the administrator. Log in and change it as soon as possible.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}"
                   style="background: #4a5f3e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                    Log In to CRT
                </a>
            </div>
            <p style="color: #888; font-size: 14px;">If you believe this was a mistake, please contact your system administrator.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">Complaint Resolution Tracker &mdash; ${FRONTEND_URL}</p>
        </div>`,
    });
}

/**
 * Send an email to the student when their complaint is marked as resolved.
 */
async function sendComplaintResolvedEmail(student, complaint) {
    const complaintUrl = `${FRONTEND_URL}/student/complaints/${complaint.id}`;
    await transporter.sendMail({
        from: FROM,
        to: student.email,
        subject: `Your Complaint #${complaint.id} has been Resolved`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #4a5f3e;">Complaint Resolved</h2>
            <p>Hi <strong>${student.name}</strong>,</p>
            <p>Your recent complaint titled "<strong>${complaint.title}</strong>" has been marked as <strong>Resolved</strong> by our staff.</p>
            <p><strong>Resolution Message:</strong><br/>
            <em>${complaint.resolution_message || "Issue addressed."}</em></p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${complaintUrl}"
                   style="background: #4a5f3e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                    View Complaint
                </a>
            </div>
            <p style="color: #888; font-size: 14px;">If you feel this issue is not fully resolved, you may reopen it by leaving a comment on the complaint page.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">Complaint Resolution Tracker &mdash; ${FRONTEND_URL}</p>
        </div>`,
    });
}

/**
 * Send an email to a worker when they are assigned a new ticket.
 */
async function sendWorkerAssignedEmail(worker, complaint) {
    const loginUrl = `${FRONTEND_URL}/login`;

    await transporter.sendMail({
        from: FROM,
        to: worker.email,
        subject: `New Complaint Assigned: #${complaint.id}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #0056b3;">New Ticket Assigned</h2>
            <p>Hi <strong>${worker.name}</strong>,</p>
            <p>You have been assigned to investigate complaint <strong>#${complaint.id}</strong> ("${complaint.title}").</p>
            <table style="background: #f9f9f9; border-radius: 6px; padding: 16px; width: 100%; margin: 16px 0;">
                <tr><td style="color: #888; padding: 4px 0;">Urgency</td><td><strong style="text-transform: capitalize;">${complaint.urgency || "Unknown"}</strong></td></tr>
                <tr><td style="color: #888; padding: 4px 0;">Category</td><td><strong>${complaint.category || "Unknown"}</strong></td></tr>
            </table>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}"
                   style="background: #0056b3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                    Log In to Review
                </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">Complaint Resolution Tracker &mdash; ${FRONTEND_URL}</p>
        </div>`,
    });
}

/**
 * Send an email to a Department Head when a complaint escalates.
 */
async function sendComplaintEscalatedEmail(departmentHeadEmail, complaint) {
    const loginUrl = `${FRONTEND_URL}/login`;

    await transporter.sendMail({
        from: FROM,
        to: departmentHeadEmail,
        subject: `URGENT: Complaint Escalated - #${complaint.id}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #dc3545;">Complaint Escalated ⚠️</h2>
            <p>Attention Department Head,</p>
            <p>A complaint has met the escalation criteria and requires your immediate attention.</p>
            <table style="background: #fff3cd; border-radius: 6px; padding: 16px; width: 100%; margin: 16px 0;">
                <tr><td style="color: #856404; padding: 4px 0;">ID</td><td><strong>#${complaint.id}</strong></td></tr>
                <tr><td style="color: #856404; padding: 4px 0;">Title</td><td><strong>${complaint.title}</strong></td></tr>
                <tr><td style="color: #856404; padding: 4px 0;">Category</td><td><strong>${complaint.category}</strong></td></tr>
                <tr><td style="color: #856404; padding: 4px 0;">Status</td><td><strong style="text-transform: capitalize;">${complaint.status}</strong></td></tr>
            </table>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}"
                   style="background: #dc3545; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                    Log In to Investigate
                </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style desert-color: #aaa; font-size: 12px;">Complaint Resolution Tracker &mdash; ${FRONTEND_URL}</p>
        </div>`,
    });
}

/**
 * Send an email to a student when their complaint is escalated.
 */
async function sendStudentEscalationEmail(student, complaint) {
    const complaintUrl = `${FRONTEND_URL}/student/complaints/${complaint.id}`;

    await transporter.sendMail({
        from: FROM,
        to: student.email,
        subject: `Your Complaint #${complaint.id} has been Escalated`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #6b4e2a;">Priority Escalation</h2>
            <p>Hi <strong>${student.name}</strong>,</p>
            <p>Your complaint titled "<strong>${complaint.title}</strong>" has been automatically <strong>Escalated</strong> to a higher priority.</p>
            <p>This happens when our system detects multiple similar issues being reported, indicating a recurring problem that requires immediate attention from our department heads.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${complaintUrl}"
                   style="background: #6b4e2a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                    Track Complaint Status
                </a>
            </div>
            <p style="color: #888; font-size: 14px;">Our staff is now working with supervisors to resolve this issue as quickly as possible.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">Complaint Resolution Tracker &mdash; ${FRONTEND_URL}</p>
        </div>`,
    });
}

/**
 * Send an email to a user when their account is removed by an admin.
 */
async function sendUserRemovedEmail(userEmail, userName) {
    await transporter.sendMail({
        from: FROM,
        to: userEmail,
        subject: 'CRT Account Removed',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #6c757d;">Account access revoked</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Your Complaint Resolution Tracker profile has been actively closed and removed by a system administrator.</p>
            <p>You will no longer be able to log in to this email address.</p>
            <p style="color: #888; font-size: 14px;">If you believe this was a mistake, please contact administration directly.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">Complaint Resolution Tracker &mdash; ${FRONTEND_URL}</p>
        </div>`,
    });
}

module.exports = { 
    sendVerificationEmail, 
    sendWorkerWelcomeEmail,
    sendComplaintResolvedEmail,
    sendWorkerAssignedEmail,
    sendComplaintEscalatedEmail,
    sendStudentEscalationEmail,
    sendUserRemovedEmail
};
