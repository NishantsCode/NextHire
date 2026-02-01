import jwt from "jsonwebtoken";

const generateToken = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "30d"
    })
    
    const isProduction = process.env.NODE_ENV?.trim() === "production";
    
    const cookieOptions = {
        maxAge: 30*24*60*60*1000,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: '/'
    };
    
    console.log('Setting cookie with options:', cookieOptions);
    console.log('Is Production:', isProduction);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    res.cookie("jwt", token, cookieOptions);
}

export default generateToken;