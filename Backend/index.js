import express from 'express'
import dotenv from 'dotenv';
import dbConnect from "./Database/dbConnect.js"
import authUserRoutes from "./Routes/authUser.js"
import jobRoutes from "./Routes/job.js"
import applicationRoutes from "./Routes/application.js"
import cookieParser from 'cookie-parser'

dotenv.config();
dbConnect();

const app = express();

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