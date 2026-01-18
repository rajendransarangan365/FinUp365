import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }, // Business/Lead Name
    customerName: { type: String },         // Contact Person Name
    phone: { type: String, required: true },
    loanType: { type: String },
    status: { type: String, default: 'NEW' },
    followUpDate: { type: String, default: 'Today' },
    photoUrl: { type: String },             // Business Card / Shop Photo
    profilePicUrl: { type: String },        // Customer Avatar
    audioUrl: { type: String },
    history: [{
        date: { type: Date, default: Date.now },
        action: String, // e.g. 'Call', 'Meeting', 'Note', 'Status Change'
        note: String,
        nextFollowUp: String,
        audioUrl: String
    }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Customer', CustomerSchema);
