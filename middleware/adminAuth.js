// middleware/adminAuth.js

module.exports = (req, res, next) => {
    // Get key from Headers
    const apiKey = req.get('x-admin-key');
    
    // Get expected key from .env (or fallback for safety)
    const EXPECTED_KEY = process.env.ADMIN_KEY || 'default-dev-key';
    
    if (!apiKey || apiKey !== EXPECTED_KEY) {
        return res.status(403).json({ error: "Forbidden: Invalid Admin Key" });
    }
    
    next();
};