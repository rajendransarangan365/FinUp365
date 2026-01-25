import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from './models/Customer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Sample data arrays for generating realistic test data
const firstNames = ['Rajesh', 'Priya', 'Amit', 'Sneha', 'Vijay', 'Kavita', 'Ravi', 'Anjali', 'Suresh', 'Meera',
    'Karthik', 'Divya', 'Arun', 'Lakshmi', 'Rakesh', 'Pooja', 'Manoj', 'Swati', 'Deepak', 'Nisha',
    'Rahul', 'Shreya', 'Ankit', 'Preeti', 'Sanjay', 'Rekha', 'Naveen', 'Madhuri', 'Ashok', 'Sangita'];

const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Nair', 'Gupta', 'Verma', 'Rao', 'Iyer',
    'Joshi', 'Mehta', 'Pillai', 'Desai', 'Chopra', 'Kapoor', 'Malhotra', 'Agarwal', 'Bansal', 'Tiwari'];

const loanTypes = ['Home Loan', 'Personal Loan', 'Business Loan', 'Car Loan', 'Education Loan', 'Gold Loan'];

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'];

const statuses = ['NEW', 'NORMAL', 'TODAY', 'CONVERTED', 'NOT_INTERESTED'];

// Helper to generate random phone number
const generatePhone = () => {
    const prefix = [98, 99, 97, 96, 95, 94, 93, 92, 91, 90];
    return `${prefix[Math.floor(Math.random() * prefix.length)]}${Math.floor(10000000 + Math.random() * 90000000)}`;
};

// Helper to generate random date within range
const getRandomDate = (daysBack, daysForward) => {
    const today = new Date();
    const randomDays = Math.floor(Math.random() * (daysForward + daysBack)) - daysBack;
    const date = new Date(today);
    date.setDate(date.getDate() + randomDays);
    return date.toISOString().split('T')[0];
};

// Main seeding function
const seedCustomers = async (userId, count = 30) => {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing customers for this user (optional - comment out if you want to keep existing)
        // await Customer.deleteMany({ userId });
        // console.log('Cleared existing test customers');

        const customers = [];

        for (let i = 0; i < count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const city = cities[Math.floor(Math.random() * cities.length)];

            customers.push({
                userId: userId,
                name: `${firstName} ${lastName}`,
                customerName: `${firstName} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
                phone: generatePhone(),
                loanType: loanTypes[Math.floor(Math.random() * loanTypes.length)],
                address: `${Math.floor(Math.random() * 999) + 1}, ${city}`,
                followUpDate: getRandomDate(30, 60), // Random date between 30 days ago and 60 days forward
                status: statuses[Math.floor(Math.random() * statuses.length)],
                coordinates: {
                    lat: 12.9716 + (Math.random() - 0.5) * 0.5, // Around Bangalore
                    lng: 77.5946 + (Math.random() - 0.5) * 0.5
                },
                history: [
                    {
                        date: new Date(),
                        action: 'Customer Added',
                        note: 'Initial contact established'
                    }
                ],
                callHistory: []
            });
        }

        // Insert all customers
        const result = await Customer.insertMany(customers);
        console.log(`✅ Successfully created ${result.length} customers!`);

        // Show summary
        console.log('\n📊 Summary:');
        console.log(`Total Customers: ${result.length}`);

        // Disconnect
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error seeding customers:', error);
        process.exit(1);
    }
};

// Get userId from command line args or use default
const userId = process.argv[2];
const count = parseInt(process.argv[3]) || 30;

if (!userId) {
    console.error('❌ Usage: node seedCustomers.js <userId> [count]');
    console.error('Example: node seedCustomers.js 507f1f77bcf86cd799439011 30');
    process.exit(1);
}

console.log(`🌱 Seeding ${count} customers for userId: ${userId}`);
seedCustomers(userId, count);
