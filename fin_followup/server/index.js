import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import workflowRoutes from './routes/workflow.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow all origins for simplicity in dev, or configure as needed
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected');
        console.log('✅ Workflow Routes Registered');
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/workflows', workflowRoutes);

// Static files (Code for serving frontend in production or uploads)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploads folder if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Root Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: 'workflow-enabled' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});