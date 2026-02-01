import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    structuredJD: {
        rolesAndResponsibilities: [{
            type: String
        }],
        eligibility: [{
            type: String
        }],
        requiredSkills: [{
            type: String
        }],
        preferredSkills: [{
            type: String
        }],
        experience: {
            type: String
        },
        education: {
            type: String
        },
        location: {
            type: String
        },
        employmentType: {
            type: String
        },
        salary: {
            type: String
        },
        benefits: [{
            type: String
        }],
        additionalInfo: {
            type: String
        }
    },
    jdFile: {
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    organizationId: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'draft'],
        default: 'active',
    }
}, { timestamps: true });

// Pre-save hook to generate unique job ID
jobSchema.pre('save', async function() {
    if (!this.jobId) {
        // Generate unique job ID: JOB-YYYYMMDD-XXXXX (e.g., JOB-20250131-A1B2C)
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        this.jobId = `JOB-${dateStr}-${randomStr}`;
        
        // Ensure uniqueness by checking existing jobs
        try {
            let exists = await this.constructor.findOne({ jobId: this.jobId });
            let attempts = 0;
            while (exists && attempts < 10) {
                const newRandomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
                this.jobId = `JOB-${dateStr}-${newRandomStr}`;
                exists = await this.constructor.findOne({ jobId: this.jobId });
                attempts++;
            }
        } catch (error) {
            console.error('Error checking job ID uniqueness:', error);
        }
    }
});

const Job = mongoose.model("job", jobSchema);
export default Job;
