const Admin = require('../models/Admin');

async function createDefaultAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            // Update existing admin password
            existingAdmin.password = '@Trust111';
            await existingAdmin.save();
            console.log('✅ Admin password updated successfully');
            console.log('Username: admin');
            console.log('Password: @Trust111');
            return;
        }

        // Create default admin
        const admin = new Admin({
            username: 'admin',
            password: '@Trust111',
            name: 'System Administrator',
            email: 'admin@templetrust.org',
            role: 'super-admin'
        });

        await admin.save();
        console.log('✅ Default admin created successfully');
        console.log('Username: admin');
        console.log('Password: @Trust111');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

// Connect to MongoDB and create admin
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
    return createDefaultAdmin();
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
