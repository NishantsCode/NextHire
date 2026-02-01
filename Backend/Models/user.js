import mongoose from 'mongoose';

const userSchema = new mongoose.Schema ({
    fullname:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password:{
        type: String,
        required: true,
        minlength: 6,
    },
    role:{
        type: String,
        enum: ['user', 'hr'],
        default: 'user',
    },
    organizationname:{
        type: String,
        required: function() {
            return this.role === 'hr';
        }
    },
    organizationid:{
        type: String,
        unique: true,
        sparse: true,
        required: function() {
            return this.role === 'hr';
        }
    },
    phone:{
        type: String,
    },
    yearsOfExperience:{
        type: String,
    },
    resume:{
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
    }
}, {timestamps: true});

const User = mongoose.model("user", userSchema);
export default User;