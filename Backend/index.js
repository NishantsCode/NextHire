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

app.set('trust proxy', 1)
// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5173',
            process.env.FRONTEND_URL
        ].filter(Boolean); // Remove undefined values
        
        console.log('Request origin:', origin);
        console.log('Allowed origins:', allowedOrigins);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Origin not allowed:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())
app.use('/uploads', express.static('uploads'))

const PORT = process.env.PORT;

app.get('/', (req, res) => {
    res.send("Server is working.")
    console.log("Server is working.")
})

app.use('/api/auth', authUserRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);



app.listen(PORT, ()=> {
    console.log(`Server is running on Port: ${PORT}`);
})