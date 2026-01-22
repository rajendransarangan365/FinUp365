import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import authMiddleware from '../middleware/auth.js';
import path from 'path';

const router = express.Router();

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: '/tmp' });

// Helper: Extract public_id from Cloudinary URL (Same logic as in customers.js)
const extractPublicId = (url) => {
    if (!url) return null;
    try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');

        if (uploadIndex !== -1) {
            let currentIndex = uploadIndex + 1;

            // Skip transformation segments and version
            while (currentIndex < parts.length) {
                const segment = parts[currentIndex];
                const isVersion = segment.startsWith('v') && !isNaN(segment.substring(1));
                const isTransformation = segment.includes(',') || segment.startsWith('w_') || segment.startsWith('h_') || segment.startsWith('c_');

                if (isVersion || isTransformation) {
                    currentIndex++;
                } else {
                    break;
                }
            }

            const publicIdWithExt = parts.slice(currentIndex).join('/');
            return publicIdWithExt.replace(/\.[^/.]+$/, '');
        }
    } catch (err) {
        console.error("Failed to extract public_id from URL:", err);
    }
    return null;
};

// 1. Register User
router.post('/register', async (req, res) => {
    let { email, password, name, agencyName } = req.body;
    if (email) email = email.trim();
    if (password) password = password.trim();

    if (!email || !password) return res.status(400).json({ error: "Email and Password required" });

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            email,
            password: hashedPassword,
            name,
            agencyName
        });
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: { _id: user._id, email: user.email, name: user.name, agencyName: user.agencyName, photoUrl: user.photoUrl }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 2. Login User
router.post('/login', async (req, res) => {
    let { email, password } = req.body;
    if (email) email = email.trim();
    if (password) password = password.trim();

    if (!email || !password) return res.status(400).json({ error: "Email and Password required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: { _id: user._id, email: user.email, name: user.name, agencyName: user.agencyName, photoUrl: user.photoUrl }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 3. Verify Password
router.post('/verify-password', authMiddleware, async (req, res) => {
    let { password } = req.body; // Expecting 'password' field
    if (password) password = password.trim();
    const { userId } = req.user;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Incorrect password" });

        res.json({ message: "Password verified" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 4. Change Password
router.post('/change-password', authMiddleware, async (req, res) => {
    // Note: We duplicate verification here for double security, 
    // but the frontend flow will rely on the previous step for UX.
    let { oldPassword, newPassword } = req.body;
    if (oldPassword) oldPassword = oldPassword.trim();
    if (newPassword) newPassword = newPassword.trim();
    const { userId } = req.user;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect old password" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 4. Update Profile
router.post('/update-profile', authMiddleware, upload.single('photo'), async (req, res) => {
    const { name, agencyName } = req.body;
    const { userId } = req.user;

    try {
        let user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (name) user.name = name;
        if (agencyName) user.agencyName = agencyName;

        if (req.file) {
            let uploadOptions = {
                folder: "finup365/profiles",
                transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
                overwrite: true,
                invalidate: true
            };

            // Check if user has an existing photo to overwrite
            if (user.photoUrl) {
                const publicId = extractPublicId(user.photoUrl);
                if (publicId) {
                    uploadOptions.public_id = publicId;
                    delete uploadOptions.folder; // IMPORTANT: Remove folder to avoid duplication
                    console.log('♻️ Overwriting existing user profile with public_id:', publicId);
                }
            }

            const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);
            user.photoUrl = result.secure_url;

            // Clean up local file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: { _id: user._id, email: user.email, name: user.name, agencyName: user.agencyName, photoUrl: user.photoUrl }
        });
    } catch (err) {
        console.error(err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
