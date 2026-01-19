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
// Multer Config (Temporary storage)
// Multer Config (Temporary storage)
// Multer Config (Memory storage for Vercel/Serverless)
const upload = multer({ storage: multer.memoryStorage() });

// Helper: Stream Upload to Cloudinary
const streamUpload = (fileBuffer, options) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (result) {
                resolve(result);
            } else {
                reject(error);
            }
        });
        stream.write(fileBuffer);
        stream.end();
    });
};

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
            followUpDate: followUpDate || new Date().toISOString().split('T')[0]
        });

        // Debug Logs
        console.log("Headers:", req.headers['content-type']);
        // console.log("Files:", req.files); // Don't log buffers, too large
        console.log("Body:", req.body);

        // 1. Upload Business Photo
        if (req.files && req.files['photo']) {
            const photoFile = req.files['photo'][0];
            const result = await streamUpload(photoFile.buffer, {
                folder: "fin_followup_photos"
            });
            newCustomer.photoUrl = result.secure_url;
        }

        // 2. Upload Profile Pic
        if (req.files && req.files['profilePic']) {
            const profileFile = req.files['profilePic'][0];
            const result = await streamUpload(profileFile.buffer, {
                folder: "fin_followup_profiles",
                transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }]
            });
            newCustomer.profilePicUrl = result.secure_url;
        }

        // 3. Upload Audio
        if (req.files && req.files['audio']) {
            const audioFile = req.files['audio'][0];
            const result = await streamUpload(audioFile.buffer, {
                resource_type: "video",
                folder: "fin_followup_audio"
            });
            newCustomer.audioUrl = result.secure_url;
        }

        await newCustomer.save();
        res.status(201).json(newCustomer);
    } catch (err) {
        console.error("Error in POST /customers:", err);
        res.status(500).json({ error: "Failed to add customer: " + err.message });
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
        console.log("PATCH Status Body:", req.body); // Debug Log
        const { status, followUpDate, note } = req.body;
        let audioUrl = null;

        // Upload Audio if present
        if (req.file) {
            console.log("Audio File Received at Backend:", req.file.originalname, req.file.size);
            const result = await streamUpload(req.file.buffer, {
                resource_type: "video",
                folder: "fin_followup_history_audio"
            });
            audioUrl = result.secure_url;
            console.log("Audio Uploaded to Cloudinary:", audioUrl);
        } else {
            console.log("No Audio File in Request");
        }

        const historyEntry = {
            date: new Date(),
            action: (status === 'RESCHEDULE' || status === 'NORMAL') ? 'Follow Up Scheduled' : (status === 'CONVERTED' ? 'Deal Closed' : 'Marked Not Interested'),
            note: note || '',
            nextFollowUp: followUpDate,
            audioUrl // Add audio URL to history
        };

        const updateFields = {
            status,
            $push: { history: historyEntry }
        };

        // Only update followUpDate if provided and valid (not "undefined" string)
        if (followUpDate && followUpDate !== 'undefined' && followUpDate !== 'null') {
            updateFields.followUpDate = followUpDate;
        }

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        );
        res.json(customer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }
});

export default router;
