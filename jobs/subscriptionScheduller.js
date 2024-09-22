const cron = require('node-cron');
const User = require('./models/User'); // Adjust the path as needed

// Schedule a task to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();

        const expiredUsers = await User.find({
            accountType: 'Premium',
            subscriptionExpiry: { $lt: now }
        });

        // Update their account type to Basic
        await User.updateMany(
            { _id: { $in: expiredUsers.map(user => user._id) } },
            { accountType: 'Basic' }
        );

    } catch (err) {
        console.error('Error updating user subscriptions:', err);
    }
});
