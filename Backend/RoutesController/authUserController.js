import User from "../Models/user.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/jwt.js";

export const register = async (req, res) => {
    try {
        const { fullname, email, password, role, organizationname, organizationid, phone } = req.body;

        if (!fullname || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Fullname, email, and password are required"
            });
        }

        // Validate HR-specific fields
        if (role === 'hr' && (!organizationname || !organizationid)) {
            return res.status(400).json({
                success: false,
                message: "Organization name and ID are required for HR registration"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            fullname,
            email,
            password: hashedPassword,
            role: role || 'user',
            phone,
        };

        // Add organization details only for HR
        if (role === 'hr') {
            userData.organizationname = organizationname;
            userData.organizationid = organizationid;
        }

        // Add resume if uploaded
        if (req.file) {
            userData.resume = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                mimetype: req.file.mimetype,
            };
        }

        const newUser = await User.create(userData);

        generateToken(newUser._id, res);

        const userResponse = {
            _id: newUser._id,
            fullname: newUser.fullname,
            email: newUser.email,
            role: newUser.role,
            phone: newUser.phone,
        };

        if (newUser.role === 'hr') {
            userResponse.organizationname = newUser.organizationname;
            userResponse.organizationid = newUser.organizationid;
        }

        if (newUser.resume) {
            userResponse.resume = newUser.resume;
        }

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: userResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Registration failed"
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        console.log('=== Login Successful ===');
        console.log('User:', user.email);
        console.log('Generating token...');
        
        generateToken(user._id, res);

        const userResponse = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            phone: user.phone,
        };

        if (user.role === 'hr') {
            userResponse.organizationname = user.organizationname;
            userResponse.organizationid = user.organizationid;
        }

        if (user.resume) {
            userResponse.resume = user.resume;
        }

        console.log('Sending response with user data');
        
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Login failed"
        });
    }
};

export const logout = async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV?.trim() === "production";
        
        res.cookie("jwt", "", { 
            maxAge: 0,
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
            path: '/'
        });
        
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Logout failed"
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const userResponse = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            phone: user.phone,
        };

        if (user.role === 'hr') {
            userResponse.organizationname = user.organizationname;
            userResponse.organizationid = user.organizationid;
        }

        if (user.resume) {
            userResponse.resume = user.resume;
        }

        res.status(200).json({
            success: true,
            user: userResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to get user"
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullname, phone, organizationname } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update allowed fields
        if (fullname) user.fullname = fullname;
        if (phone !== undefined) user.phone = phone;
        if (user.role === 'hr' && organizationname) {
            user.organizationname = organizationname;
        }

        // Update resume if uploaded
        if (req.file) {
            user.resume = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                mimetype: req.file.mimetype,
            };
        }

        await user.save();

        const userResponse = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            phone: user.phone,
        };

        if (user.role === 'hr') {
            userResponse.organizationname = user.organizationname;
            userResponse.organizationid = user.organizationid;
        }

        if (user.resume) {
            userResponse.resume = user.resume;
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: userResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update profile"
        });
    }
};
