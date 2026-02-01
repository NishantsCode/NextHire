import Application from '../Models/application.js';
import Job from '../Models/job.js';
import { calculateATSScore, calculateBulkATSScores } from '../utils/atsScorer.js';

/**
 * Calculate ATS score for a single application
 */
export const calculateSingleATSScore = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const organizationId = req.user.organizationid;

        console.log('\n╔════════════════════════════════════════╗');
        console.log('║  SINGLE ATS SCORE REQUEST RECEIVED     ║');
        console.log('╚════════════════════════════════════════╝');
        console.log('Application ID:', applicationId);
        console.log('Organization ID:', organizationId);
        console.log('Requested by:', req.user.fullname);

        // Find application and populate job
        console.log('\n🔍 Fetching application from database...');
        const application = await Application.findById(applicationId).populate('jobId');
        
        if (!application) {
            console.log('❌ Application not found');
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        console.log('✅ Application found');
        console.log('  Candidate:', application.fullname);
        console.log('  Job:', application.jobId.title);

        // Verify job belongs to user's organization
        if (application.jobId.organizationId !== organizationId) {
            console.log('❌ Unauthorized access attempt');
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        console.log('✅ Authorization verified');

        // Calculate ATS score with structured JD
        console.log('\n🎯 Starting ATS score calculation...');
        
        // Prepare structured job data for better matching
        const jobData = {
            title: application.jobId.title,
            description: application.jobId.description,
            structuredJD: application.jobId.structuredJD || {}
        };
        
        const atsScore = await calculateATSScore(
            application.resume.path,
            application.resume.mimetype,
            jobData
        );

        console.log('\n💾 Saving ATS score to database...');
        // Update application with ATS score
        application.atsScore = atsScore;
        await application.save();
        console.log('✅ ATS score saved successfully');

        console.log('\n📤 SENDING RESPONSE TO CLIENT:');
        console.log('  Score:', atsScore.score + '%');
        console.log('  Matched Skills:', atsScore.matchedSkills?.length || 0);
        console.log('  Missing Skills:', atsScore.missingSkills?.length || 0);

        res.status(200).json({
            success: true,
            message: 'ATS score calculated successfully',
            atsScore
        });

        console.log('\n✅ Response sent successfully\n');
    } catch (error) {
        console.error('\n❌ ERROR in calculateSingleATSScore:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to calculate ATS score'
        });
    }
};

/**
 * Calculate ATS scores for all applications of a job
 */
export const calculateJobATSScores = async (req, res) => {
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

        // Get all applications for this job
        const applications = await Application.find({ jobId });

        if (applications.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No applications to score',
                results: []
            });
        }

        // Prepare structured job data
        const jobData = {
            title: job.title,
            description: job.description,
            structuredJD: job.structuredJD || {}
        };

        // Calculate ATS scores for all applications (with parallel processing)
        const results = await calculateBulkATSScores(applications, jobData);

        // Update applications with scores
        for (const result of results) {
            if (result.success) {
                await Application.findByIdAndUpdate(
                    result.applicationId,
                    { atsScore: result.atsScore }
                );
            }
        }

        // Get updated applications sorted by score
        const updatedApplications = await Application.find({ jobId }).sort({ 'atsScore.score': -1 });

        res.status(200).json({
            success: true,
            message: 'ATS scores calculated successfully',
            results,
            applications: updatedApplications
        });
    } catch (error) {
        console.error('Bulk ATS calculation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to calculate ATS scores'
        });
    }
};

/**
 * Bulk update application statuses
 */
export const bulkUpdateStatus = async (req, res) => {
    try {
        const { applicationIds, status } = req.body;
        const organizationId = req.user.organizationid;

        if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Application IDs array is required'
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        // Verify all applications belong to user's organization
        const applications = await Application.find({
            _id: { $in: applicationIds }
        }).populate('jobId');

        const unauthorizedApps = applications.filter(
            app => app.jobId.organizationId !== organizationId
        );

        if (unauthorizedApps.length > 0) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to some applications'
            });
        }

        // Update all applications
        await Application.updateMany(
            { _id: { $in: applicationIds } },
            { $set: { status } }
        );

        res.status(200).json({
            success: true,
            message: `${applicationIds.length} applications updated to ${status}`,
            count: applicationIds.length
        });
    } catch (error) {
        console.error('Bulk status update error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update applications'
        });
    }
};
