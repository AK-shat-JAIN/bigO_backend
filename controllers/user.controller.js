import User from "../models/user.model.js"
import AppError from "../utils/error.util.js"
import sendEmail from "../utils/sendEmail.js"
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import crypto from 'crypto'

const cookieOptions = {
    secure: process.env.NODE_ENV === 'production' ? true : false,
    // expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',   // 'none' for cross-domain
    // secure: true
}

const register = async (req, res, next) => {
    const { fullName, phone, email, password, role, profile, branch, todo} = req.body

    if(!fullName || !email || !password){
        return next(new AppError('Please fill in all fields', 400))
    }

    const userExist = await User.findOne({ email })
    if(userExist){
        return next(new AppError('User already exists', 400))
    }

    const user = await User.create({
        fullName,
        phone,
        email,
        password,
        avatar: {
            public_id: email,
            secure_id: '123'
        },
        role,
        profile,
        branch,
        todo
    })

    if(!user){
        return next(new AppError('User registeration failed, Please try again later', 400))
    }
    
    // File related work
    if(req.file){
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'user',
                width: 250,
                height: 250,
                gravity: 'face',
                crop: 'fill'
            })

            if(result){
                user.avatar.public_id = result.public_id
                user.avatar.secure_id = result.secure_url

                // remove file from server

                fs.rm(`uploads/${req.file.filename}`)
            }
        } catch (error) {
            return next(new AppError(error.message || 'Problem with file upload', 500))
        }
    }
    await user.save()

    user.password = undefined   // To not send the password in the response

    const token = await user.getJwtToken()
    res.cookie('token', token, cookieOptions)

    return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user
    })
}

const login = async (req, res, next) => {
    const { email, password} = req.body

    try {
        if(!email || !password){
            return next(new AppError('Please fill in all fields', 400))
        }
    
        const user = await User.findOne({ email }).select('+password')
    
        if(!user || !(await user.comparePassword(password))){
            return next(new AppError('Invalid email or password', 400))
        }
    
        const token = await user.getJwtToken()
        res.cookie('token', token, cookieOptions)
    
        user.password = undefined
        return res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            user
        })        
    } catch (error) {
        return next(new AppError(error.message, 500))
    }

}

const logout = async (req, res, next) => {
    res.cookie('token', null, {
        secure: process.env.NODE_ENV === 'production' ? true : false,
        maxAge: 0,
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    })
}

const profile = async (req, res, next) => {
    try {
        const userID = req.user.id
        const user = await User.findById(userID)
        
        return res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            user
        })       
    } catch (error) {
        return next(new AppError('Failed to fetch User profile', 500))
    }
}

const forgotPassword = async (req, res, next) => {
    const { email } = req.body

    if(!email){
        return next(new AppError('Please enter your email', 400))
    }

    const user = await User.findOne({ email })
    if(!user){
        return next(new AppError('User not found', 404))
    }

    const resetToken = await user.getResetPasswordToken()
    await user.save()                                                 // This will save the forgorPasswordToken and forgorPasswordExpire in the database

    const resetPasswordUrl = `${req.protocol}://${req.get('host')}/api/v1/user/reset/${resetToken}`
    // const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    // We here need to send an email to the user with the token
    const subject = 'LMS Password Recovery'
    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your Password</a>\n or click on ${resetPasswordUrl}\n\n\nIf you have not requested this email, then ignore it.`

    try{
        await sendEmail(email, subject, message)

        return res.status(200).json({
            success: true,
            message: `Email sent to ${email} successfully`
        })
    }catch(error){
        user.forgortPasswordToken = undefined
        user.forgortPasswordExpire = undefined

        await user.save()

        return next(new AppError(error.message || 'Email could not be sent', 500))
    }
}

const resetPassword = async (req, res, next) => {
    const { token } = req.params
    const { password } = req.body

    if(!token || !password){
        return next(new AppError('Please enter your password', 400))
    }

    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')

    const user = await User.findOne({
        forgortPasswordToken: resetPasswordToken,
        forgortPasswordExpire: { $gt: Date.now() }
    })
    if(!user){
        return next(new AppError('Invalid token or token has expired. Please try again', 400))
    }

    user.password = password
    user.forgortPasswordToken = undefined
    user.forgortPasswordExpire = undefined
    await user.save()

    return res.status(200).json({
        success: true,
        message: 'Password updated successfully'
    })
}

const changePassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body
    const userID = req.user.id

    if(!oldPassword || !newPassword){
        return next(new AppError('Please enter your old and new password', 400))
    }

    const user = await User.findById(userID).select('+password')
    if(!user){
        return next(new AppError('User does not exists', 400))
    }

    const isMatch = await user.comparePassword(oldPassword)
    if(!isMatch){
        return next(new AppError('Old password is incorrect', 400))
    }

    user.password = newPassword
    await user.save()

    user.password = undefined

    return res.status(200).json({
        success: true,
        message: 'Password updated successfully'
    })
}

const updateUser = async (req, res, next) => {
    const { fullName } = req.body
    const { id } = req.params

    const user = await User.findById(id)
    if(!user){
        return next(new AppError('User does not exists', 400))
    }
    if(fullName){
        user.fullName = fullName
    }

    if(req.file){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id)
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'lms',
                width: 250,
                height: 250,
                gravity: 'face',
                crop: 'fill'
            })

            if(result){
                user.avatar.secure_id = result.secure_url
                user.avatar.public_id = result.public_id

                // remove file from server
                fs.rm(`uploads/${req.file.filename}`)
            }
        } catch (error) {
            return next(new AppError(error.message || 'Problem with file upload', 500))
        }
    }
    await user.save()

    return res.status(200).json({
        success: true,
        message: 'User updated successfully'
    })
}

export { register, login, logout, profile, forgotPassword, resetPassword, changePassword, updateUser }