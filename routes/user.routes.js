import express from 'express';
import { register, login, logout, profile, forgotPassword, resetPassword, changePassword, updateUser } from '../controllers/user.controller.js';
import { isLoggedin } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const router = express.Router();

router.post('/register', upload.single('avatar'), register);  //admin only
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', isLoggedin, profile);
router.post('/forgot', forgotPassword);
router.post('/reset/:token', resetPassword);
router.post('/change-password', isLoggedin, changePassword);
router.put('/update/:id', isLoggedin, upload.single('avatar'), updateUser);

export default router;