const User = require('../models/User');
const mongoose = require('mongoose');

// Get user's friends list
exports.getFriendsList = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId)
      .populate('friends', 'fullName username email avatar status')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      success: true,
      friends: user.friends || [] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get friend requests received
exports.getFriendRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId)
      .populate('friendRequests', 'fullName username email avatar status')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      success: true,
      friendRequests: user.friendRequests || [] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pending requests sent
exports.getPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId)
      .populate('pendingRequests', 'fullName username email avatar status')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      success: true,
      pendingRequests: user.pendingRequests || [] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search users to add as friends
exports.searchUsers = async (req, res) => {
  console.log('\n🔍 === SEARCH USERS DEBUG START ===');
  
  try {
    const { userId } = req.params;
    const { query } = req.query;
    
    console.log('📥 Request details:');
    console.log('- userId from params:', userId);
    console.log('- query from query params:', query);
    console.log('- req.params:', req.params);
    console.log('- req.query:', req.query);
    console.log('- full URL:', req.originalUrl);

    if (!query || query.trim().length < 2) {
      console.log('❌ Query too short');
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      console.log('❌ Current user not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('👤 Current user found:', currentUser.email);

    // Search users by username, fullName, or email
    const searchQuery = {
      $and: [
        { _id: { $ne: userId } }, // Exclude current user
        { _id: { $nin: currentUser.blockList || [] } }, // Exclude blocked users
        { blockList: { $nin: [userId] } }, // Exclude users who blocked current user
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { fullName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    };
    
    console.log('🗃️ MongoDB search query:', JSON.stringify(searchQuery, null, 2));
    
    const users = await User.find(searchQuery)
      .select('fullName username email avatar status')
      .limit(20);
      
    console.log('📊 Raw search results:');
    console.log('- Number of users found:', users.length);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user._id}, Email: ${user.email}, Username: ${user.username}`);
    });

    // Add friendship status for each user
    const usersWithStatus = users.map(user => {
      let friendshipStatus = 'none';
      
      if (currentUser.friends && currentUser.friends.includes(user._id)) {
        friendshipStatus = 'friends';
      } else if (currentUser.pendingRequests && currentUser.pendingRequests.includes(user._id)) {
        friendshipStatus = 'pending_sent';
      } else if (currentUser.friendRequests && currentUser.friendRequests.includes(user._id)) {
        friendshipStatus = 'pending_received';
      } else if (currentUser.blockList && currentUser.blockList.includes(user._id)) {
        friendshipStatus = 'blocked';
      }

      console.log(`👥 User ${user.email} status: ${friendshipStatus}`);

      return {
        ...user.toObject(),
        friendshipStatus
      };
    });

    console.log('✅ Final results:', usersWithStatus.length, 'users');
    console.log('🔍 === SEARCH USERS DEBUG END ===\n');

    res.status(200).json({ 
      success: true,
      users: usersWithStatus 
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send friend request
exports.addFriend = async (req, res) => {
  try {
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

    // Check if already friends
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already sent
    if (sender.pendingRequests.includes(receiverId)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Check if blocked
    if (sender.blockList.includes(receiverId) || receiver.blockList.includes(senderId)) {
      return res.status(400).json({ error: 'Cannot send friend request' });
    }

    // Add to sender's pending requests
    sender.pendingRequests.push(receiverId);
    // Add to receiver's friend requests
    receiver.friendRequests.push(senderId);

    await sender.save();
    await receiver.save();

    res.status(200).json({ 
      success: true,
      message: 'Friend request sent successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { userId, requesterId } = req.body;

    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request exists
    if (!user.friendRequests.includes(requesterId)) {
      return res.status(400).json({ error: 'Friend request not found' });
    }

    // Remove from requests and add to friends
    user.friendRequests.pull(requesterId);
    user.friends.push(requesterId);

    requester.pendingRequests.pull(userId);
    requester.friends.push(userId);

    await user.save();
    await requester.save();

    res.status(200).json({ 
      success: true,
      message: 'Friend request accepted' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject friend request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { userId, requesterId } = req.body;

    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from requests
    user.friendRequests.pull(requesterId);
    requester.pendingRequests.pull(userId);

    await user.save();
    await requester.save();

    res.status(200).json({ 
      success: true,
      message: 'Friend request rejected' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel friend request
exports.cancelFriendRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from pending and requests
    sender.pendingRequests.pull(receiverId);
    receiver.friendRequests.pull(senderId);

    await sender.save();
    await receiver.save();

    res.status(200).json({ 
      success: true,
      message: 'Friend request cancelled' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unfriend
exports.unfriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from both users' friends list
    user.friends.pull(friendId);
    friend.friends.pull(userId);

    await user.save();
    await friend.save();

    res.status(200).json({ 
      success: true,
      message: 'Unfriended successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Block friend
exports.blockFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from friends and add to block list
    user.friends.pull(friendId);
    user.pendingRequests.pull(friendId);
    user.friendRequests.pull(friendId);
    
    if (!user.blockList.includes(friendId)) {
      user.blockList.push(friendId);
    }

    // Clean up the other user's lists
    friend.friends.pull(userId);
    friend.pendingRequests.pull(userId);
    friend.friendRequests.pull(userId);

    await user.save();
    await friend.save();

    res.status(200).json({ 
      success: true,
      message: 'User blocked successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unblock friend
exports.unblockFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from block list
    user.blockList.pull(friendId);
    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'User unblocked successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('blockList', 'fullName username email avatar')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      success: true,
      blockedUsers: user.blockList || [] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user profile for friends
exports.getUserProfile = async (req, res) => {
  try {
    const { userId, targetUserId } = req.params;

    const currentUser = await User.findById(userId);
    const targetUser = await User.findById(targetUserId)
      .select('fullName username email avatar status dateOfBirth phone');

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if blocked
    if (currentUser.blockList.includes(targetUserId) || targetUser.blockList.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine friendship status
    let friendshipStatus = 'none';
    if (currentUser.friends.includes(targetUserId)) {
      friendshipStatus = 'friends';
    } else if (currentUser.pendingRequests.includes(targetUserId)) {
      friendshipStatus = 'pending_sent';
    } else if (currentUser.friendRequests.includes(targetUserId)) {
      friendshipStatus = 'pending_received';
    }

    res.status(200).json({ 
      success: true,
      user: {
        ...targetUser.toObject(),
        friendshipStatus
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get recommended friends (all users excluding friends, blocked, and current user)
exports.getRecommendedFriends = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all user IDs to exclude
    const excludeIds = [
      userId, // Current user
      ...(currentUser.friends || []), // Current friends
      ...(currentUser.pendingRequests || []), // Sent requests
      ...(currentUser.friendRequests || []), // Received requests
      ...(currentUser.blockList || []) // Blocked users
    ];

    // Find users that are not in the exclude list and not blocking current user
    const recommendedUsers = await User.find({
      $and: [
        { _id: { $nin: excludeIds } },
        { blockList: { $nin: [userId] } }, // Users who haven't blocked current user
        { status: 'active' } // Only active users
      ]
    })
    .select('fullName username email avatar status')
    .limit(20)
    .sort({ createdAt: -1 }); // Show newest users first

    // Add friendship status for each user (should all be 'none')
    const usersWithStatus = recommendedUsers.map(user => ({
      ...user.toObject(),
      friendshipStatus: 'none'
    }));

    res.status(200).json({ 
      success: true,
      users: usersWithStatus 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Debug endpoint to test search
exports.debugSearch = async (req, res) => {
  try {
    const { query } = req.query;
    
    console.log('🐛 Debug search for:', query);
    
    // Find all users matching the query
    const allMatches = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('fullName username email status');
    
    console.log('All matches:', allMatches);
    
    res.json({
      success: true,
      query: query,
      allMatches: allMatches,
      count: allMatches.length
    });
  } catch (error) {
    console.error('Debug search error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Debug endpoint to list all users
exports.listAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('_id email username fullName').limit(10);
    
    console.log('📋 All users in DB:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}, Email: ${user.email}, Username: ${user.username}`);
    });
    
    res.json({
      success: true,
      users: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: error.message });
  }
};

// Simple test endpoint 
exports.testUserExists = async (req, res) => {
  try {
    const { email } = req.query;
    console.log('🔍 Testing if user exists with email:', email);
    
    const user = await User.findOne({ email: email });
    console.log('👤 User found:', !!user);
    if (user) {
      console.log('- User ID:', user._id);
      console.log('- User email:', user.email);
      console.log('- User username:', user.username);
    }
    
    res.json({
      exists: !!user,
      user: user ? {
        _id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName
      } : null
    });
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ error: error.message });
  }
};
