import jwt from "jsonwebtoken";

const generateToken = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "30d"
    })
    res.cookie("jwt", token, {
        maxAge: 30*24*60*60*1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production"
    })
}

export default generateToken;