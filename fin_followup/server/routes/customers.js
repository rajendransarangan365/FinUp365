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

// Configure Upload Fields
const cpUpload = upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'profilePic', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
]);

// 1. Add Customer (with Audio, Photo, Profile)
router.post('/', cpUpload, async (req, res) => {
    const { userId, name, customerName, phone, loanType, followUpDate } = req.body;

    try {
        const newCustomer = new Customer({
            userId,
            name,
            customerName,
            phone,
            loanType,
            followUpDate: followUpDate || 'Today'
        });

        // 1. Upload Business Photo
        if (req.files['photo']) {
            const photoFile = req.files['photo'][0];
            const result = await cloudinary.uploader.upload(photoFile.path, {
                folder: "fin_followup_photos"
            });
            newCustomer.photoUrl = result.secure_url;
            fs.unlinkSync(photoFile.path);
        }

        // 2. Upload Profile Pic
        if (req.files['profilePic']) {
            const profileFile = req.files['profilePic'][0];
            const result = await cloudinary.uploader.upload(profileFile.path, {
                folder: "fin_followup_profiles",
                transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }]
            });
            newCustomer.profilePicUrl = result.secure_url;
            fs.unlinkSync(profileFile.path);
        }

        // 3. Upload Audio
        if (req.files['audio']) {
            const audioFile = req.files['audio'][0];
            const result = await cloudinary.uploader.upload(audioFile.path, {
                resource_type: "video",
                folder: "fin_followup_audio"
            });
            newCustomer.audioUrl = result.secure_url;
            fs.unlinkSync(audioFile.path);
        }

        await newCustomer.save();
        res.status(201).json(newCustomer);
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
router.patch('/:id/status', upload.single('audio'), async (req, res) => {
    try {
        const { status, followUpDate, note } = req.body;
        let audioUrl = null;

        // Upload Audio if present
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "video",
                folder: "fin_followup_history_audio"
            });
            audioUrl = result.secure_url;
            fs.unlinkSync(req.file.path);
        }

        const historyEntry = {
            date: new Date(),
            action: status === 'RESCHEDULE' ? 'Follow Up Scheduled' : (status === 'CONVERTED' ? 'Deal Closed' : 'Marked Not Interested'),
            note: note || '',
            nextFollowUp: followUpDate,
            audioUrl // Add audio URL to history
        };

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            {
                status,
                followUpDate,
                $push: { history: historyEntry }
            },
            { new: true }
        );
        res.json(customer);
    } catch (err) {
        console.error(err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: "Update failed" });
    }
});

export default router;
