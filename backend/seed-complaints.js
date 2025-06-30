const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');
const Complaint = require('./models/Complaint');

const seedComplaints = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in the .env file');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Successfully connected to MongoDB.');

        // Find a user to be the complainant. If no user, create one.
        let complainant = await User.findOne({ email: { $ne: 'admin@example.com' } });
        if (!complainant) {
            console.log('No user found, creating a sample user...');
            complainant = await User.create({
                username: 'sampleuser',
                email: 'sample@example.com',
                password: 'password123',
                fullName: 'Sample User'
            });
            console.log(`Created user: ${complainant.username}`);
        } else {
            console.log(`Using existing user as complainant: ${complainant.username}`);
        }

        const complaintsData = [
            {
                user: complainant._id,
                subject: 'Payment failed for Event Ticket',
                description: 'I tried to buy a ticket for the "Summer Music Festival" but the payment failed. My card was charged but I did not receive a ticket. Please investigate and refund.',
                category: 'payment',
                priority: 'high',
                status: 'pending',
            },
            {
                user: complainant._id,
                subject: 'Inappropriate behavior by another user',
                description: 'A user named "BadUser123" sent me harassing messages after the "Tech Conference 2024". I have screenshots if needed.',
                category: 'user_behavior',
                priority: 'medium',
                status: 'pending',
            },
            {
                user: complainant._id,
                subject: 'Technical Issue: Website is slow',
                description: 'The website has been very slow to load over the past few days, especially the event listings page. It makes it difficult to browse for new events.',
                category: 'technical',
                priority: 'low',
                status: 'in_progress',
            },
            {
                user: complainant._id,
                subject: 'Question about an event',
                description: 'I have a question about the accessibility options for the "Art Exhibition". Is the venue wheelchair accessible?',
                category: 'event',
                priority: 'medium',
                status: 'resolved',
                resolution: 'Contacted the event organizer and confirmed that the venue is fully wheelchair accessible. Emailed the user with the confirmation.',
                resolvedAt: new Date(),
            }
        ];

        // Clean up old sample complaints before inserting new ones
        await Complaint.deleteMany({ 'user': complainant._id });
        console.log('Cleared old sample complaints for this user.');

        await Complaint.insertMany(complaintsData);
        console.log(`Successfully inserted ${complaintsData.length} sample complaints into the database.`);

    } catch (error) {
        console.error('Error seeding complaints:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit();
    }
};

seedComplaints(); 