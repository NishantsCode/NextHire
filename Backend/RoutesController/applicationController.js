import Application from '../Models/application.js';
import Job from '../Models/job.js';
import { sendApplicationConfirmationEmail, sendStatusUpdateEmail } from '../utils/emailService.js';

export const createApplication = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'You must be logged in to apply for jobs'
            });
        }

        const { jobId, fullname, email, phone, coverLetter, yearsOfExperience } = req.body;

        if (!jobId || !fullname || !email || !yearsOfExperience) {
            return res.status(400).json({
                success: false,
                message: 'Job ID, fullname, email, and years of experience are required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Resume is required'
            });
        }

        // Check if job exists and is active
        const job = await Job.findById(jobId).populate('createdBy', 'organizationname');
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Prevent applying to closed jobs
        if (job.status === 'closed') {
            return res.status(400).json({
                success: false,
                message: 'This job is no longer accepting applications'
            });
        }

        // Check if already applied
        const existingApplication = await Application.findOne({ 
            jobId, 
            userId: req.user._id 
        });
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied to this job'
            });
        }

        const applicationData = {
            userId: req.user._id,
            jobId,
            fullname,
            email,
            phone: phone || '',
            yearsOfExperience,
            coverLetter,
            resume: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                mimetype: req.file.mimetype,
            }
        };

        const application = await Application.create(applicationData);

        // Send confirmation email (don't wait for it, send async)
        sendApplicationConfirmationEmail(
            email,
            fullname,
            job.title,
            job.createdBy?.organizationname || 'the company'
        ).catch(err => {
            console.error('Failed to send application confirmation email:', err);
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit application'
        });
    }
};

export const getApplicationsByJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const organizationId = req.user.organizationid;

        // Verify job belongs to user's organization
        const job = await Job.findOne({ _id: jobId, organizationId });
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        const applications = await Application.find({ jobId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            applications,
            job
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch applications'
        });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const application = await Application.findById(id).populate('jobId');
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Verify job belongs to user's organization
        if (application.jobId.organizationId !== req.user.organizationid) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const oldStatus = application.status;
        application.status = status;
        await application.save();

        // Send status update email only if status actually changed
        if (oldStatus !== status) {
            sendStatusUpdateEmail(
                application.email,
                application.fullname,
                application.jobId.title,
                req.user.organizationname,
                status
            ).catch(err => {
                console.error('Failed to send status update email:', err);
            });
        }

        res.status(200).json({
            success: true,
            message: 'Application status updated',
            application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update application'
        });
    }
};

export const getAllPublicJobs = async (req, res) => {
    try {
        // Return all jobs (active and closed) so users can see them
        // Frontend will handle disabling apply for closed jobs
        const jobs = await Job.find()
            .populate('createdBy', 'fullname organizationname')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            jobs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch jobs'
        });
    }
};
