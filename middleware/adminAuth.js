// middleware/adminAuth.js

const ADMIN_KEY = "my-secret-admin-key"; // In production, use process.env.ADMIN_KEY

module.exports = (req, res, next) => {
    const apiKey = req.get('x-admin-key');
    
    if (!apiKey || apiKey !== ADMIN_KEY) {
        return res.status(403).json({ error: "Forbidden: Invalid Admin Key" });
    }
    
    next();
};