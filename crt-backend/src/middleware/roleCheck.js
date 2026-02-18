/**
 * Role-based authorization middleware factory
 * @param {Array<string>} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated (should be set by auth middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
};

module.exports = roleCheck;
