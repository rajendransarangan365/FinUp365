import express from 'express';
import Customer from '../models/Customer.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

const router = express.Router();
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from one level up (server/.env)
dotenv.config({ path: path.join(__dirname, '../.env') });

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Config (Temporary storage)
const upload = multer({ dest: 'uploads/' });

// Middleware to check Auth (simplified)
// In a real app, verify JWT from header
const requireAuth = (req, res, next) => {
    // For now, we trust the userId passed in body/query. 
    // TODO: Add JWT middleware
    next();
};

// 1. Add Customer (with files)
router.post('/', upload.fields([{ name: 'photo' }, { name: 'audio' }]), async (req, res) => {
    try {
        const { userId, name, phone, loanType } = req.body;

        // Upload logic
        let photoUrl = "";
        let audioUrl = "";

        if (req.files['photo']) {
            const photoFile = req.files['photo'][0];
            const result = await cloudinary.uploader.upload(photoFile.path, {
                folder: "finup365/photos"
            });
            photoUrl = result.secure_url;
            fs.unlinkSync(photoFile.path); // Clean up temp file
        }

        if (req.files['audio']) {
            const audioFile = req.files['audio'][0];
            const result = await cloudinary.uploader.upload(audioFile.path, {
                resource_type: "video", // Audio is treated as video in Cloudinary
                folder: "finup365/voice"
            });
            audioUrl = result.secure_url;
            fs.unlinkSync(audioFile.path);
        }

        const newCustomer = new Customer({
            userId,
            name,
            phone,
            loanType,
            photoUrl,
            audioUrl
        });

        await newCustomer.save();
        res.json(newCustomer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add customer" });
    }
});

// 2. Get Customers for User
router.get('/:userId', async (req, res) => {
    try {
        const customers = await Customer.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: "Internal Error" });
    }
});

// 3. Update Status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, followUpDate } = req.body;
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { status, followUpDate },
            { new: true }
        );
        res.json(customer);
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

export default router;
