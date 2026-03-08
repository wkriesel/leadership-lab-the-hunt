const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function generateToken(userId, email) {
    return jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

module.exports = { verifyToken, generateToken };
