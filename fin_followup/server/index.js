import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);

// Database Connection
console.log("Attempting to connect to MongoDB...");
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => {
        console.error('MongoDB Connection Failed:');
        console.error(err);
    });

// Routes (Placeholder)
app.get('/', (req, res) => {
    res.send('FinUp365 Backend is Running');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Server Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Start Server (Only if running locally)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
