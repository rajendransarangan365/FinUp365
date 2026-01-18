import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    loanType: { type: String },
    status: { type: String, default: 'NEW' },
    followUpDate: { type: String, default: 'Today' },
    photoUrl: { type: String },
    audioUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Customer', CustomerSchema);
