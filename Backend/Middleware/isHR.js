const isHR = (req, res, next) => {
    if (req.user && req.user.role === 'hr') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. HR role required.'
        });
    }
};

export default isHR;
