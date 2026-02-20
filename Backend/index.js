import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors';
import dbConnect from "./Database/dbConnect.js"
import authUserRoutes from "./Routes/authUser.js"
import jobRoutes from "./Routes/job.js"
import applicationRoutes from "./Routes/application.js"
import cookieParser from 'cookie-parser'

dotenv.config();
dbConnect();

const app = express();
const dev=process.env.IS_DEV?true:false;

app.set('trust proxy', 1)
// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            process.env.FRONTEND_URL,
            'https://nexthirejob.vercel.app'
        ].filter(Boolean); // Remove undefined values
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())
app.use('/uploads', express.static('uploads'))

const PORT = process.env.PORT;

app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: "Server is working",
        timestamp: new Date().toISOString()
    })
})

app.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: "Server is healthy",
        environment: process.env.NODE_ENV,
        emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
        timestamp: new Date().toISOString()
    })
})

app.use('/api/auth', authUserRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

// Test email endpoint (remove in production or protect with auth)
app.post('/api/test-email', async (req, res) => {
    try {
        const { sendApplicationConfirmationEmail } = await import('./utils/emailService.js');
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address required'
            });
        }

        const result = await sendApplicationConfirmationEmail(
            email,
            'Test User',
            'Test Position',
            'Test Company'
        );

        res.json({
            success: result.success,
            message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
            error: result.error,
            messageId: result.messageId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error testing email',
            error: error.message
        });
    }
});


if(dev){

app.listen(PORT, ()=> {
    console.log(`Server is running on Port: ${PORT}`);
})
}