import express from 'express';
import { createApplication, getApplicationsByJob, updateApplicationStatus, getAllPublicJobs } from '../RoutesController/applicationController.js';
import { getMyApplications, getAppliedJobIds } from '../RoutesController/userApplicationController.js';
import { calculateSingleATSScore, calculateJobATSScores, bulkUpdateStatus } from '../RoutesController/atsController.js';
import isLogin from '../Middleware/isLogin.js';
import isHR from '../Middleware/isHR.js';
import uploadResume from '../Middleware/uploadResume.js';

const router = express.Router();

// Public routes
router.get('/jobs/public', getAllPublicJobs);

// Protected routes (for logged in users)
router.post('/apply', isLogin, uploadResume.single('resume'), createApplication);

// User routes (logged in users)
router.get('/my-applications', isLogin, getMyApplications);
router.get('/applied-jobs', isLogin, getAppliedJobIds);

// Protected routes (for HR only)
router.get('/job/:jobId', isLogin, isHR, getApplicationsByJob);
router.put('/:id/status', isLogin, isHR, updateApplicationStatus);

// Bulk actions (for HR only)
router.put('/bulk/status', isLogin, isHR, bulkUpdateStatus);

// ATS scoring routes (for HR only)
router.post('/ats/calculate/:applicationId', isLogin, isHR, calculateSingleATSScore);
router.post('/ats/calculate-job/:jobId', isLogin, isHR, calculateJobATSScores);

export default router;
