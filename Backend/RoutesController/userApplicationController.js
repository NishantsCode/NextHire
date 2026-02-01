import Application from '../Models/application.js';

export const getMyApplications = async (req, res) => {
    try {
        const userId = req.user._id;

        const applications = await Application.find({ userId })
            .populate({
                path: 'jobId',
                populate: {
                    path: 'createdBy',
                    select: 'organizationname fullname email'
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            applications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch applications'
        });
    }
};

export const getAppliedJobIds = async (req, res) => {
    try {
        const userId = req.user._id;

        const applications = await Application.find({ userId }).select('jobId');
        const appliedJobIds = applications.map(app => app.jobId.toString());

        res.status(200).json({
            success: true,
            appliedJobIds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch applied jobs'
        });
    }
};
