import jwt from 'jsonwebtoken';
import User from '../Models/user.js';

const isLogin = async (req, res, next) => {
    try {
        console.log('=== isLogin Middleware ===');
        console.log('Cookies:', req.cookies);
        console.log('Headers:', req.headers);
        console.log('Origin:', req.get('origin'));
        
        const token = req.cookies.jwt;

        if (!token) {
            console.log('No token found in cookies');
            console.log('All cookies:', Object.keys(req.cookies));
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - No token provided'
            });
        }

        console.log('Token found:', token.substring(0, 20) + '...');

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            console.log('Token verification failed');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Invalid token'
            });
        }

        console.log('Token decoded successfully, userId:', decoded.userId);

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            console.log('User not found for userId:', decoded.userId);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('User authenticated:', user.email, 'Role:', user.role);
        req.user = user;
        next();
    } catch (error) {
        console.error('Error in isLogin middleware:', error.message);
        res.status(401).json({
            success: false,
            message: 'Unauthorized - Invalid token',
            error: error.message
        });
    }
};

export default isLogin;
