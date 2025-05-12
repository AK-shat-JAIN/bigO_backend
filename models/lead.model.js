import { Schema, model } from "mongoose"

const leadSchema = new Schema({
    fullName: {
        type: String,
        required: [true, 'Please enter your full name'],
        trim: true,
        maxlength: [50, 'Full name cannot exceed 50 characters'],
        minlength: [5, 'Full name must be at least 5 characters long'],
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        trim: true,
        lowercase: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please fill in a valid email address',
        ]
    },
    phone: {
        type: String,
        required: [true, 'Please enter your phone number'],
        trim: true,
        match: [
            /^(\+)?([ 0-9]){10,14}$/,
            'Please fill in a valid phone number',
        ]
    },
    org: {
        type: String,
        enum: ['crc', 'm3m', 'godrej', 'botani']
    },
    forgortPasswordToken: String,
    forgortPasswordExpire: Date
}, {
    timestamps: true
})


const Lead = model('Lead', leadSchema)
export default Lead