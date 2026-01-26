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

// 1.5 Get Single Customer Details (for Edit)
router.get('/details/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.json(customer);
    } catch (err) {
        console.error("Error fetching customer details:", err);
        res.status(500).json({ error: "Failed to fetch customer details" });
    }
});

// 2. Get Customers for User (with Pagination)
router.get('/:userId', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for hasMore calculation
        const totalCount = await Customer.countDocuments({ userId: req.params.userId });

        // Fetch paginated customers
        const customers = await Customer.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.json({
            customers,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalCount,
                totalPages: Math.ceil(totalCount / limitNum),
                hasMore: skip + customers.length < totalCount
            }
        });
    } catch (err) {
        console.error("Error fetching customers:", err);
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

// Helper: Extract public_id from Cloudinary URL
const extractPublicId = (url) => {
    if (!url) return null;
    try {
        // Cloudinary URL format: .../upload/[transformations]/[version]/[folder]/[id].[ext]
        // Examples:
        // No version/trans: .../upload/folder/pic.jpg
        // With version: .../upload/v12345/folder/pic.jpg
        // With trans: .../upload/w_200,h_200/folder/pic.jpg
        // With both: .../upload/w_200,h_200/v12345/folder/pic.jpg

        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');

        if (uploadIndex !== -1) {
            // Start looking from segment after 'upload'
            let currentIndex = uploadIndex + 1;

            // Skip transformation segments (usually contain ',' or start with trans params like w_, h_, c_, etc)
            // Also skip version segments (v12345)
            while (currentIndex < parts.length) {
                const segment = parts[currentIndex];
                const isVersion = segment.startsWith('v') && !isNaN(segment.substring(1));
                const isTransformation = segment.includes(',') || segment.startsWith('w_') || segment.startsWith('h_') || segment.startsWith('c_');

                if (isVersion || isTransformation) {
                    currentIndex++;
                } else {
                    // Found the start of public_id
                    break;
                }
            }

            // Join the rest as public_id (handling folders)
            const publicIdWithExt = parts.slice(currentIndex).join('/');
            // Remove file extension
            return publicIdWithExt.replace(/\.[^/.]+$/, '');
        }
    } catch (err) {
        console.error("Failed to extract public_id from URL:", err);
    }
    return null;
};

// Helper: Delete from Cloudinary
const deleteFromCloudinary = async (url, resourceType = 'image') => {
    if (!url) return;
    try {
        const publicId = extractPublicId(url);
        if (publicId) {
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

        // Also delete audio notes from history
        if (customer.history && customer.history.length > 0) {
            for (const item of customer.history) {
                if (item.audioUrl) {
                    await deleteFromCloudinary(item.audioUrl, 'video');
                }
            }
        }

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

        // Handle file uploads with cache invalidation
        // 1. Upload Business Photo
        if (req.files && req.files['photo']) {
            console.log('📸 New business card photo detected');

            const photoFile = req.files['photo'][0];
            let uploadOptions = {
                folder: "fin_followup_photos",
                invalidate: true, // Clear CDN cache for immediate update
                overwrite: true
            };

            // If updating existing image, use same public_id to maintain URL
            if (currentCustomer.photoUrl) {
                const publicId = extractPublicId(currentCustomer.photoUrl);
                if (publicId) {
                    uploadOptions.public_id = publicId;
                    console.log('♻️ Overwriting existing business card with public_id:', publicId);
                }
            }

            console.log('☁️ Uploading new business card to Cloudinary...');
            const result = await streamUpload(photoFile.buffer, uploadOptions);
            updateData.photoUrl = result.secure_url;
            console.log('✅ New business card URL:', result.secure_url);
        }

        // 2. Upload Profile Pic
        if (req.files && req.files['profilePic']) {
            console.log('📸 New profile picture detected');

            const profileFile = req.files['profilePic'][0];
            let uploadOptions = {
                folder: "fin_followup_profiles",
                transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }],
                invalidate: true, // Clear CDN cache for immediate update
                overwrite: true
            };

            // If updating existing image, use same public_id to maintain URL
            if (currentCustomer.profilePicUrl) {
                const publicId = extractPublicId(currentCustomer.profilePicUrl);
                if (publicId) {
                    uploadOptions.public_id = publicId;
                    console.log('♻️ Overwriting existing profile pic with public_id:', publicId);
                }
            }

            const result = await streamUpload(profileFile.buffer, uploadOptions);
            updateData.profilePicUrl = result.secure_url;
            console.log('✅ New profile pic URL:', result.secure_url);
        }

        // 3. Upload Audio
        if (req.files && req.files['audio']) {
            console.log('🎤 New audio detected');

            const audioFile = req.files['audio'][0];
            let uploadOptions = {
                resource_type: "video",
                folder: "fin_followup_audio",
                invalidate: true, // Clear CDN cache for immediate update
                overwrite: true
            };

            // If updating existing audio, use same public_id to maintain URL
            if (currentCustomer.audioUrl) {
                const publicId = extractPublicId(currentCustomer.audioUrl);
                if (publicId) {
                    uploadOptions.public_id = publicId;
                    console.log('♻️ Overwriting existing audio with public_id:', publicId);
                }
            }

            const result = await streamUpload(audioFile.buffer, uploadOptions);
            updateData.audioUrl = result.secure_url;
            console.log('✅ New audio URL:', result.secure_url);
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

// 7. Upload Business Card Photo Only (Separate Upload)
router.post('/:id/upload-photo', upload.single('photo'), async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No photo file provided" });
        }

        console.log('📸 Uploading business card for customer:', req.params.id);

        // Prepare upload options
        let uploadOptions = {
            folder: "fin_followup_photos",
            invalidate: true,
            overwrite: true
        };

        // If customer has existing photo, use same public_id to overwrite
        if (customer.photoUrl) {
            const publicId = extractPublicId(customer.photoUrl);
            if (publicId) {
                uploadOptions.public_id = publicId;
                delete uploadOptions.folder; // IMPORTANT: Remove folder if public_id is set to avoid duplication
                console.log('♻️ Overwriting existing business card with public_id:', publicId);
            }
        }

        // Upload to Cloudinary
        const result = await streamUpload(req.file.buffer, uploadOptions);
        console.log('✅ Business card uploaded to Cloudinary:', result.secure_url);

        // Update customer record with new URL
        customer.photoUrl = result.secure_url;
        await customer.save();

        res.json({
            photoUrl: result.secure_url,
            message: "Business card uploaded successfully"
        });
    } catch (err) {
        console.error("Error uploading business card:", err);
        res.status(500).json({ error: "Failed to upload business card" });
    }
});

// 8. Upload Profile Picture Only (Separate Upload)
router.post('/:id/upload-profile', upload.single('profilePic'), async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No profile picture file provided" });
        }

        console.log('📸 Uploading profile picture for customer:', req.params.id);

        // Prepare upload options
        let uploadOptions = {
            folder: "fin_followup_profiles",
            transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }],
            invalidate: true,
            overwrite: true
        };

        // If customer has existing profile pic, use same public_id to overwrite
        if (customer.profilePicUrl) {
            const publicId = extractPublicId(customer.profilePicUrl);
            if (publicId) {
                uploadOptions.public_id = publicId;
                delete uploadOptions.folder; // IMPORTANT: Remove folder if public_id is set to avoid duplication
                console.log('♻️ Overwriting existing profile pic with public_id:', publicId);
            }
        }

        // Upload to Cloudinary
        const result = await streamUpload(req.file.buffer, uploadOptions);
        console.log('✅ Profile picture uploaded to Cloudinary:', result.secure_url);

        // Update customer record with new URL
        customer.profilePicUrl = result.secure_url;
        await customer.save();

        res.json({
            profilePicUrl: result.secure_url,
            message: "Profile picture uploaded successfully"
        });
    } catch (err) {
        console.error("Error uploading profile picture:", err);
        res.status(500).json({ error: "Failed to upload profile picture" });
    }
});

export default router;
