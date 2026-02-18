const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('studentId')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('Student ID must be between 3 and 50 characters'),
    validate
];

/**
 * Validation rules for login
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email or Student ID is required'),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate
];

/**
 * Validation rules for creating a complaint
 */
const createComplaintValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 5, max: 255 }).withMessage('Title must be between 5 and 255 characters'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
    body('category')
        .trim()
        .notEmpty().withMessage('Category is required'),
    body('urgency')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level'),
    validate
];

/**
 * Validation rules for updating complaint status
 */
const updateStatusValidation = [
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
    body('note')
        .optional()
        .trim(),
    validate
];

/**
 * Validation rules for adding notes
 */
const addNoteValidation = [
    body('note')
        .trim()
        .notEmpty().withMessage('Note is required')
        .isLength({ min: 1 }).withMessage('Note cannot be empty'),
    body('isPublic')
        .optional()
        .isBoolean().withMessage('isPublic must be a boolean'),
    validate
];

/**
 * Validation rules for feedback
 */
const feedbackValidation = [
    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comments')
        .optional()
        .trim(),
    validate
];

/**
 * Validation rules for creating a user (admin)
 */
const createUserValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['student', 'worker', 'admin']).withMessage('Invalid role'),
    body('department')
        .optional()
        .trim(),
    body('studentId')
        .optional()
        .trim(),
    validate
];

/**
 * Validation for ID parameters
 */
const idParamValidation = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid ID'),
    validate
];

module.exports = {
    registerValidation,
    loginValidation,
    createComplaintValidation,
    updateStatusValidation,
    addNoteValidation,
    feedbackValidation,
    createUserValidation,
    idParamValidation,
    validate
};
