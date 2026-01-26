import express from 'express';
import Template from '../models/Template.js';

const router = express.Router();

// Get all templates for a user
router.get('/:userId', async (req, res) => {
    try {
        if (!req.params.userId || req.params.userId === 'undefined' || req.params.userId.length < 12) {
            return res.status(200).json([]);
        }
        const templates = await Template.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json(templates);
    } catch (error) {
        console.error("Template Fetch Error:", error);
        // If specific cast error, just return empty
        if (error.name === 'CastError') {
            return res.status(200).json([]);
        }
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Create a new template
router.post('/', async (req, res) => {
    try {
        const { userId, title, content } = req.body;
        if (!userId || !title || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newTemplate = new Template({ userId, title, content });
        await newTemplate.save();
        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Delete a template
router.delete('/:id', async (req, res) => {
    try {
        await Template.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router;
