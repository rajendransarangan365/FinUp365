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
    const { userId, name, customerName, phone, loanType, address, followUpDate } = req.body;

    let parsedCoordinates = null;
    if (req.body.coordinates) {
        try {
            parsedCoordinates = JSON.parse(req.body.coordinates);
        } catch (e) {
            console.error("Error parsing coordinates:", e);
        }
    }

    try {
        const newCustomer = new Customer({
            userId,
            name,
            customerName,
            phone,
            loanType,
            address,
            coordinates: parsedCoordinates,
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

        const { status, followUpDate, note } = req.body;
        let audioUrl = null;

        // Upload Audio if present
        if (req.file) {
            const result = await streamUpload(req.file.buffer, {
                resource_type: "video",
                folder: "fin_followup_history_audio"
            });
            audioUrl = result.secure_url;
        } else {
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

        console.log("✅ Customer updated in DB. Latest history entry:",
            customer.history[customer.history.length - 1]);

        res.json(customer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }
});

// 4. Log Call History
router.post('/:id/call-log', async (req, res) => {
    try {
        const { status, note } = req.body;
        const callEntry = {
            date: new Date(),
            status,
            note: note || ''
        };

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { $push: { callHistory: callEntry } },
            { new: true }
        );

        res.json(customer);
    } catch (err) {
        console.error("Error logging call:", err);
        res.status(500).json({ error: "Failed to log call" });
    }
});

// Helper: Delete from Cloudinary
const deleteFromCloudinary = async (url, resourceType = 'image') => {
    if (!url) return;
    try {
        // Extract public ID from URL
        // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/filename.jpg
        // Public ID: folder/filename
        const parts = url.split('/');
        const versionIndex = parts.findIndex(part => part.startsWith('v') && !isNaN(part.substring(1)));
        // If version found, take everything after it
        if (versionIndex !== -1) {
            const publicIdWithExt = parts.slice(versionIndex + 1).join('/');
            const publicId = publicIdWithExt.split('.')[0]; // Remove extension
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            console.log(`🗑️ Deleted old ${resourceType}: ${publicId}`);
        }
    } catch (err) {
        console.error("Failed to delete image from Cloudinary:", err);
    }
};

// 5. Delete Customer
router.delete('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        // Delete associated files from Cloudinary
        if (customer.photoUrl) await deleteFromCloudinary(customer.photoUrl);
        if (customer.profilePicUrl) await deleteFromCloudinary(customer.profilePicUrl);
        if (customer.audioUrl) await deleteFromCloudinary(customer.audioUrl, 'video'); // Audio uses video resource type usually

        await Customer.findByIdAndDelete(req.params.id);
        res.json({ message: "Customer deleted successfully" });
    } catch (err) {
        console.error("Error deleting customer:", err);
        res.status(500).json({ error: "Failed to delete customer" });
    }
});

// 6. Update Customer Details
router.put('/:id', cpUpload, async (req, res) => {
    try {
        const { name, customerName, phone, loanType, address, followUpDate } = req.body;
        const currentCustomer = await Customer.findById(req.params.id);

        if (!currentCustomer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        let parsedCoordinates = null;
        if (req.body.coordinates) {
            try {
                parsedCoordinates = JSON.parse(req.body.coordinates);
            } catch (e) {
                console.error("Error parsing coordinates:", e);
            }
        }

        const updateData = {
            name,
            customerName,
            phone,
            loanType,
            address
        };

        if (followUpDate) updateData.followUpDate = followUpDate;
        if (parsedCoordinates) updateData.coordinates = parsedCoordinates;

        // Handle file uploads & cleanup old files
        // 1. Upload Business Photo
        if (req.files && req.files['photo']) {
            console.log('📸 New business card photo detected');
            // Delete old
            if (currentCustomer.photoUrl) {
                console.log('🗑️ Deleting old business card:', currentCustomer.photoUrl);
                await deleteFromCloudinary(currentCustomer.photoUrl);
            }

            const photoFile = req.files['photo'][0];
            console.log('☁️ Uploading new business card to Cloudinary...');
            const result = await streamUpload(photoFile.buffer, {
                folder: "fin_followup_photos"
            });
            updateData.photoUrl = result.secure_url;
            console.log('✅ New business card URL:', result.secure_url);
        }

        // 2. Upload Profile Pic
        if (req.files && req.files['profilePic']) {
            // Delete old
            if (currentCustomer.profilePicUrl) await deleteFromCloudinary(currentCustomer.profilePicUrl);

            const profileFile = req.files['profilePic'][0];
            const result = await streamUpload(profileFile.buffer, {
                folder: "fin_followup_profiles",
                transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }]
            });
            updateData.profilePicUrl = result.secure_url;
        }

        // 3. Upload Audio
        if (req.files && req.files['audio']) {
            // Delete old (Note: needs resource_type video usually for audio)
            if (currentCustomer.audioUrl) await deleteFromCloudinary(currentCustomer.audioUrl);

            const audioFile = req.files['audio'][0];
            const result = await streamUpload(audioFile.buffer, {
                resource_type: "video",
                folder: "fin_followup_audio"
            });
            updateData.audioUrl = result.secure_url;
        }

        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        console.log('✅ Customer updated successfully. New photoUrl:', updatedCustomer.photoUrl);
        res.json(updatedCustomer);

    } catch (err) {
        console.error("Error updating customer:", err);
        res.status(500).json({ error: "Failed to update customer" });
    }
});

export default router;
