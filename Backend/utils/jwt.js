import jwt from "jsonwebtoken";

const generateToken = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "30d"
    })
    
    const isProduction = process.env.NODE_ENV?.trim() === "production";
    
    res.cookie("jwt", token, {
        maxAge: 30*24*60*60*1000,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction
    })
}

export default generateToken;