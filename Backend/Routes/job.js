import express from 'express';
import { createJob, getJobs, getJobById, updateJob, deleteJob } from '../RoutesController/jobController.js';
import isLogin from '../Middleware/isLogin.js';
import isHR from '../Middleware/isHR.js';
import upload from '../Middleware/upload.js';

const router = express.Router();

router.post('/create', isLogin, isHR, upload.single('jdFile'), createJob);
router.get('/', isLogin, isHR, getJobs);
router.get('/:id', isLogin, isHR, getJobById);
router.put('/:id', isLogin, isHR, updateJob);
router.delete('/:id', isLogin, isHR, deleteJob);

export default router;
