import express from 'express'
import { register, login, logout, getMe, updateProfile } from '../RoutesController/authUserController.js';
import isLogin from '../Middleware/isLogin.js';
import uploadResume from '../Middleware/uploadResume.js';

const router = express.Router();

router.post('/register', uploadResume.single('resume'), register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', isLogin, getMe);
router.put('/update-profile', isLogin, uploadResume.single('resume'), updateProfile);

export default router;