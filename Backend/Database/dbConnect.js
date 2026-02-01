import mongoose from 'mongoose'

const dbConnect = async () =>{
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MonogDB Connection Successful");
        
    } catch (error) {
        console.log(`DB Connection Failed ${error}`);
    }
}

export default dbConnect;