import mongoose from 'mongoose';

const WorkflowSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    steps: [{ type: String }], // Simple array of strings for step names
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Workflow', WorkflowSchema);
