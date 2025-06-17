const User = require('../models/User');
const mongoose = require('mongoose');

exports.getFriendsList = async (req, res) => {
  const { userId, status } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const user = await User.findById(userId)
    .populate('friends.user', 'name email avatar') // Select only desired fields
    .lean(); // Return plain JS object for easier manipulation

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let friends = user.friends || [];

  // Optional: filter by status (accepted, pending, etc.)
  if (status) {
    friends = friends.filter(f => f.status === status);
  }

  res.status(200).json({ friends });
};


exports.blockFriend = async (req, res) => {
  const { userId, friendId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ error: 'Invalid user ID(s)' });
  }

  const user = await User.findById(userId);
  const friend = await User.findById(friendId);

  if (!user || !friend) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userFriend = user.friends.find(f => f.user.equals(friendId));
  const friendFriend = friend.friends.find(f => f.user.equals(userId));

  if (userFriend) {
    userFriend.status = 'blocked';
  } else {
    user.friends.push({ user: friendId, status: 'blocked' });
  }

  if (friendFriend) {
    friendFriend.status = 'blocked';
  } else {
    friend.friends.push({ user: userId, status: 'blocked' });
  }

  await user.save();
  await friend.save();

  res.status(200).json({ message: 'Friend has been blocked' });
};

exports.unblockFriend = async (req, res) => {
  const { userId, friendId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ error: 'Invalid user ID(s)' });
  }

  const user = await User.findById(userId);
  const friend = await User.findById(friendId);

  if (!user || !friend) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userFriend = user.friends.find(f => f.user.equals(friendId));
  const friendFriend = friend.friends.find(f => f.user.equals(userId));

  if (userFriend && userFriend.status === 'blocked') {
    userFriend.status = 'accepted';
  }

  if (friendFriend && friendFriend.status === 'blocked') {
    friendFriend.status = 'accepted';
  }

  await user.save();
  await friend.save();

  res.status(200).json({ message: 'Friend has been unblocked' });
};



exports.getSentRequests = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate('friends.user', 'name avatar email');
  if (!user) return res.status(404).json({ error: 'User not found' });

  const sent = user.friends.filter(f => f.status === 'pending' && f.direction === 'sent');
  res.status(200).json({ sent });
};


exports.cancelFriendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  if (!sender || !receiver) return res.status(404).json({ error: 'User not found' });

  sender.friends = sender.friends.filter(f => !(f.user.equals(receiverId) && f.status === 'pending'));
  receiver.friends = receiver.friends.filter(f => !(f.user.equals(senderId) && f.status === 'pending'));

  await sender.save();
  await receiver.save();

  res.status(200).json({ message: 'Friend request canceled' });
};

exports.searchFriends = async (req, res) => {
  const { userId } = req.params;
  const { query } = req.query;

  const user = await User.findById(userId).populate('friends.user', 'name email avatar');
  if (!user) return res.status(404).json({ error: 'User not found' });

  const filtered = user.friends.filter(f =>
    f.status === 'accepted' &&
    (f.user.name?.toLowerCase().includes(query.toLowerCase()) ||
     f.user.email?.toLowerCase().includes(query.toLowerCase()))
  );

  res.status(200).json({ results: filtered });
};

// Dem so luong ban be, yeu cau ket ban, da gui yeu cau, da bi chan
exports.getFriendCounts = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const counts = {
    total: user.friends.filter(f => f.status === 'accepted').length,
    pending: user.friends.filter(f => f.status === 'pending' && f.direction === 'received').length,
    sent: user.friends.filter(f => f.status === 'pending' && f.direction === 'sent').length,
    blocked: user.friends.filter(f => f.status === 'blocked').length
  };

  res.status(200).json(counts);
};


// Tim kiem ban be dua vao danh sach ban be
exports.searchFriends = async (req, res) => {
  const { userId } = req.params;
  const { query } = req.query;

  const user = await User.findById(userId).populate('friends.user', 'name email avatar');
  if (!user) return res.status(404).json({ error: 'User not found' });

  const filtered = user.friends.filter(f =>
    f.status === 'accepted' &&
    (f.user.name?.toLowerCase().includes(query.toLowerCase()) ||
     f.user.email?.toLowerCase().includes(query.toLowerCase()))
  );

  res.status(200).json({ results: filtered });
};


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


exports.getMutualFriends = async (req, res) => {
  const { userId1, userId2 } = req.params;

  const user1 = await User.findById(userId1);
  const user2 = await User.findById(userId2);

  if (!user1 || !user2) return res.status(404).json({ error: 'User not found' });

  const user1Friends = user1.friends.filter(f => f.status === 'accepted').map(f => f.user.toString());
  const user2Friends = user2.friends.filter(f => f.status === 'accepted').map(f => f.user.toString());

  const mutual = user1Friends.filter(uid => user2Friends.includes(uid));
  res.status(200).json({ mutual });
};
