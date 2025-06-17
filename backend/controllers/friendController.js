const User = require('../models/User');
const mongoose = require('mongoose');

exports.addFriend = async (req, res) => {
    const { senderId, receiverId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ error: 'Invalid user ID(s)' });
    }

    if (senderId === receiverId) {
        return res.status(400).json({ error: "You can't add yourself" });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Check if already friends or pending
    const alreadyRequested = sender.friends.some(f =>
        f.user.equals(receiverId) && (f.status === 'pending' || f.status === 'accepted')
    );

    if (alreadyRequested) {
        return res.status(400).json({ error: 'Friend request already sent or already friends' });
    }

    // Add to sender's list
    sender.friends.push({ user: receiverId, status: 'pending' });

    // Add to receiver's list (incoming request)
    receiver.friends.push({ user: senderId, status: 'pending' });

    await sender.save();
    await receiver.save();

    res.status(200).json({ message: 'Friend request sent' });
};


exports.unfriend = async (req, res) => {
    const { userId, friendId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
        return res.status(400).json({ error: 'Invalid user ID(s)' });
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Remove friend from both lists
    user.friends = user.friends.filter(f => !f.user.equals(friendId));
    friend.friends = friend.friends.filter(f => !f.user.equals(userId));

    await user.save();
    await friend.save();

    res.status(200).json({ message: 'Unfriended successfully' });
};
