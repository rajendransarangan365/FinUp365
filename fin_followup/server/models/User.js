import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    agencyName: { type: String },
    photoUrl: { type: String },
    reminderHoursBefore: { type: Number, default: 2 }, // Hours before meeting to send reminder
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
