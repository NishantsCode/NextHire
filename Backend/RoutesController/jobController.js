import Job from '../Models/job.js';
import { extractJobFromFile } from '../utils/jdExtractor.js';

export const createJob = async (req, res, next) => {
    try {
        let { title, description, structuredJD } = req.body;
        const userId = req.user._id;
        const organizationId = req.user.organizationid;
        
        // Initialize jobData early
        const jobData = {
            title: '',
            description: '',
            createdBy: userId,
            organizationId,
        };

        // If file is uploaded, extract job details from it
        if (req.file) {
            try {
                const extractedData = await extractJobFromFile(req.file.path, req.file.mimetype);
                
                // Use extracted data if title/description not provided
                if (!title) title = extractedData.title;
                if (!description) description = extractedData.description;
                
                // Store structured JD if available
                if (extractedData.structuredJD) {
                    jobData.structuredJD = extractedData.structuredJD;
                }
            } catch (extractError) {
                console.error('Extraction error:', extractError);
                // If extraction fails, continue with manual input if provided
                if (!title || !description) {
                    return res.status(400).json({
                        success: false,
                        message: 'Failed to extract job details from file. Please provide title and description manually.'
                    });
                }
            }
        }

        // Handle manual structured JD input
        if (structuredJD && typeof structuredJD === 'string') {
            try {
                jobData.structuredJD = JSON.parse(structuredJD);
            } catch (parseError) {
                console.error('Failed to parse structuredJD:', parseError);
            }
        } else if (structuredJD && typeof structuredJD === 'object') {
            jobData.structuredJD = structuredJD;
        }

        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Either upload a JD file or provide title and description'
            });
        }

        // Update jobData with final values
        jobData.title = title;
        jobData.description = description;

        // Add file info if uploaded
        if (req.file) {
            jobData.jdFile = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                mimetype: req.file.mimetype,
            };
        }

        // Validate required structured fields
        const requiredFields = {
            location: 'Location',
            salary: 'Stipend/Salary Range',
            experience: 'Experience Level',
            requiredSkills: 'Required Skills',
            preferredSkills: 'Preferred Skills',
            rolesAndResponsibilities: 'Responsibilities',
            eligibility: 'Eligibility'
        };

        const missingFields = [];
        const structuredData = jobData.structuredJD || {};

        for (const [field, label] of Object.entries(requiredFields)) {
            if (Array.isArray(structuredData[field])) {
                // For array fields, check if they have at least one non-empty value
                const hasValue = structuredData[field].some(item => item && item.trim());
                if (!hasValue) {
                    missingFields.push(label);
                }
            } else {
                // For string fields, check if they exist and are not empty
                if (!structuredData[field] || !structuredData[field].trim()) {
                    missingFields.push(label);
                }
            }
        }

        // If there are missing fields, return them for the frontend to handle
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                requiresCompletion: true,
                missingFields,
                extractedData: {
                    title,
                    description,
                    structuredJD: jobData.structuredJD || {},
                    jdFile: jobData.jdFile
                },
                message: `Please provide the following required fields: ${missingFields.join(', ')}`
            });
        }

        const job = await Job.create(jobData);
        
        res.status(201).json({
            success: true,
            message: 'Job created successfully',
            job
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create job'
        });
    }
};

export const getJobs = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationid;
        
        const jobs = await Job.find({ organizationId })
            .populate('createdBy', 'fullname email')
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

export const getJobById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organizationid;

        const job = await Job.findOne({ _id: id, organizationId })
            .populate('createdBy', 'fullname email');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.status(200).json({
            success: true,
            job
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch job'
        });
    }
};

export const updateJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, status } = req.body;
        const organizationId = req.user.organizationid;

        const job = await Job.findOne({ _id: id, organizationId });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (title) job.title = title;
        if (description) job.description = description;
        if (status) job.status = status;

        await job.save();

        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            job
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update job'
        });
    }
};

export const deleteJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organizationid;

        const job = await Job.findOneAndDelete({ _id: id, organizationId });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete job'
        });
    }
};
