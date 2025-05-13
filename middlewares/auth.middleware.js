import User from "../models/user.model.js";
import AppError from "../utils/error.util.js"
import jwt from 'jsonwebtoken'

const isLoggedin = async (req, res, next) => {
    const {token} = req.cookies;
    if(!token){
        return next(new AppError('You are not logged in / Unauthenticated', 401))
    }
    try{      
        const userDetails = await jwt.verify(token, process.env.JWT_SECRET)
        req.user = userDetails
        next()
    }catch(err){
        return next(new AppError('You are not logged in / Unauthenticated', 401))
    }
}

// const authorizedRoles = (...roles) => async (req, res, next) =>{        
//     const curresntUserRole = req.user.role
//     if(!roles.includes(curresntUserRole)){
//         return next(new AppError('You are not authorized to access this route', 403))
//     }
//     next()
// }

export {
    isLoggedin,
    // authorizedRoles
}