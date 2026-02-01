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
        path: '/',
        domain: isProduction ? undefined : undefined // Let browser handle domain
    };
    
    console.log('Setting cookie with options:', cookieOptions);
    console.log('Is Production:', isProduction);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Token being set:', token.substring(0, 20) + '...');
    
    res.cookie("jwt", token, cookieOptions);
    
    // Also return token in response body as fallback
    return token;
}

export default generateToken;