import express from 'express';
import Workflow from '../models/Workflow.js';
import User from '../models/User.js';

const router = express.Router();

// GET all workflows for a user
router.get('/:userId', async (req, res) => {
    try {
        const workflows = await Workflow.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(workflows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create workflow
router.post('/', async (req, res) => {
    const { userId, name, steps, description } = req.body;
    try {
        const newWorkflow = new Workflow({
            userId,
            name,
            steps,
            description
        });
        const savedWorkflow = await newWorkflow.save();
        res.status(201).json(savedWorkflow);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update workflow
router.put('/:id', async (req, res) => {
    try {
        const updatedWorkflow = await Workflow.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedWorkflow);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE workflow
router.delete('/:id', async (req, res) => {
    try {
        await Workflow.findByIdAndDelete(req.params.id);

        // If this was active, unset it in User
        // Note: This is a loose cleanup; ideally perform transaction
        await User.updateMany(
            { activeWorkflowId: req.params.id },
            { $set: { activeWorkflowId: null } }
        );

        res.json({ message: 'Workflow deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH Activate/Deactivate Workflow
router.patch('/:id/activate', async (req, res) => {
    const { userId, isActive } = req.body; // isActive: true to activate, false to deactivate

    try {
        if (isActive) {
            // Set this workflow ID to user
            const user = await User.findByIdAndUpdate(
                userId,
                { activeWorkflowId: req.params.id },
                { new: true }
            );
            res.json({ message: 'Workflow activated', activeWorkflowId: user.activeWorkflowId });
        } else {
            // Check if this is indeed the active one before removing
            const user = await User.findById(userId);
            if (user.activeWorkflowId && user.activeWorkflowId.toString() === req.params.id) {
                user.activeWorkflowId = null;
                await user.save();
                res.json({ message: 'Workflow deactivated', activeWorkflowId: null });
            } else {
                res.json({ message: 'Workflow was not active', activeWorkflowId: user.activeWorkflowId });
            }
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
