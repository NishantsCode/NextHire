import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'job',
        required: true,
    },
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: false,
    },
    yearsOfExperience: {
        type: String,
        required: true,
    },
    resume: {
        filename: {
            type: String,
            required: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: true,
        },
        mimetype: {
            type: String,
            required: true,
        },
    },
    coverLetter: {
        type: String,
    },
    atsScore: {
        score: {
            type: Number,
            min: 0,
            max: 100,
        },
        analysis: {
            type: String,
        },
        matchedSkills: [{
            type: String,
        }],
        missingSkills: [{
            type: String,
        }],
        strengths: [{
            type: String,
        }],
        recommendations: {
            type: String,
        },
        interviewFocus: [{
            type: String,
        }],
        trainingNeeds: [{
            type: String,
        }],
        calculatedAt: {
            type: Date,
        }
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
        default: 'pending',
    }
}, { timestamps: true });

const Application = mongoose.model("application", applicationSchema);
export default Application;
