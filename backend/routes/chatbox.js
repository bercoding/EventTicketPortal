const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Hàm tìm kiếm sự kiện theo địa điểm
const searchEventsByLocation = async (location) => {
  try {
    console.log('🔍 Searching for events in:', location);
    
    const query = { 
      status: 'approved',
      'location.city': { $regex: location, $options: 'i' }
    };
    
    console.log('📋 MongoDB query:', JSON.stringify(query, null, 2));
    
    const events = await Event.find(query)
      .populate('organizers', 'username fullName avatar')
      .populate('ticketTypes')
      .limit(5)
      .sort({ startDate: 1 });
    
    console.log('📊 Events found:', events.length);
    events.forEach(event => {
      console.log(`- ${event.title} (${event.location.city})`);
    });
    
    return events;
  } catch (error) {
    console.error('❌ Error searching events:', error);
    return [];
  }
};

// Hàm tìm kiếm sự kiện theo chủ đề
const searchEventsByCategory = async (category) => {
  try {
    console.log('🎵 Searching for events with category:', category);
    
    const query = { 
      status: 'approved',
      $or: [
        { category: { $in: [category] } },
        { tags: { $in: [category] } }
      ]
    };
    
    console.log('📋 MongoDB query:', JSON.stringify(query, null, 2));
    
    const events = await Event.find(query)
      .populate('organizers', 'username fullName avatar')
      .populate('ticketTypes')
      .limit(5)
      .sort({ startDate: 1 });
    
    console.log('📊 Events found:', events.length);
    events.forEach(event => {
      console.log(`- ${event.title} (category: ${event.category?.join(', ')}, tags: ${event.tags?.join(', ')})`);
    });
    
    return events;
  } catch (error) {
    console.error('❌ Error searching events:', error);
    return [];
  }
};

// Hàm tìm kiếm sự kiện theo địa điểm VÀ chủ đề
const searchEventsByLocationAndCategory = async (location, category) => {
  try {
    console.log('🔍 Searching for events in:', location, 'with category:', category);
    
    const query = { 
      status: 'approved',
      'location.city': { $regex: location, $options: 'i' },
      $or: [
        { category: { $in: [category] } },
        { tags: { $in: [category] } }
      ]
    };
    
    console.log('📋 MongoDB query:', JSON.stringify(query, null, 2));
    
    const events = await Event.find(query)
      .populate('organizers', 'username fullName avatar')
      .populate('ticketTypes')
      .limit(5)
      .sort({ startDate: 1 });
    
    console.log('📊 Events found:', events.length);
    events.forEach(event => {
      console.log(`- ${event.title} (${event.location.city}, category: ${event.category?.join(', ')}, tags: ${event.tags?.join(', ')})`);
    });
    
    return events;
  } catch (error) {
    console.error('❌ Error searching events:', error);
    return [];
  }
};

// Hàm tạo context cho AI
const createEventContext = (events) => {
  if (!events || events.length === 0) {
    return "KHÔNG CÓ SỰ KIỆN NÀO";
  }
  
  let context = "CÓ SỰ KIỆN SAU:\n\n";
  events.forEach((event, index) => {
    const startDate = new Date(event.startDate).toLocaleDateString('vi-VN');
    const ticketTypes = event.ticketTypes?.map(tt => `${tt.name}: ${tt.price?.toLocaleString()}đ`) || [];
    
    context += `${index + 1}. **${event.title}**\n`;
    context += `   📅 Ngày: ${startDate}\n`;
    context += `   📍 Địa điểm: ${event.location.venueName || event.location.address || 'Chưa cập nhật'}\n`;
    context += `   🏙️ Thành phố: ${event.location.city}\n`;
    if (event.category && event.category.length > 0) {
      context += `   🏷️ Danh mục: ${event.category.join(', ')}\n`;
    }
    if (event.tags && event.tags.length > 0) {
      context += `   🏷️ Tags: ${event.tags.join(', ')}\n`;
    }
    if (ticketTypes.length > 0) {
      context += `   💰 Giá vé: ${ticketTypes.join(', ')}\n`;
    }
    if (event.description) {
      context += `   📝 Mô tả: ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}\n`;
    }
    context += `\n`;
  });
  
  return context;
};

// Hàm nhận diện địa điểm từ message
const extractLocation = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Danh sách các thành phố và mapping
  const cityMapping = {
    'đà nẵng': 'Thành phố Đà Nẵng',
    'danang': 'Thành phố Đà Nẵng',
    'hà nội': 'Thành phố Hà Nội', 
    'hanoi': 'Thành phố Hà Nội',
    'tp.hcm': 'Thành phố Hồ Chí Minh',
    'ho chi minh': 'Thành phố Hồ Chí Minh',
    'hồ chí minh': 'Thành phố Hồ Chí Minh',
    'hải phòng': 'Thành phố Hải Phòng',
    'haiphong': 'Thành phố Hải Phòng',
    'đồng nai': 'Tỉnh Đồng Nai',
    'tỉnh đồng nai': 'Tỉnh Đồng Nai'
  };
  
  // Tìm thành phố trong message
  for (const [keyword, fullName] of Object.entries(cityMapping)) {
    if (lowerMessage.includes(keyword)) {
      console.log('📍 Found location:', keyword, '→', fullName);
      return fullName;
    }
  }
  
  return null;
};

// Hàm nhận diện category từ message
const extractCategory = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Danh sách các category và mapping - sử dụng đúng tên trong database
  const categoryMapping = {
    'âm nhạc': 'music',
    'nhạc': 'music',
    'ca nhạc': 'music',
    'concert': 'concert',
    'music': 'music',
    'thể thao': 'sports',
    'bóng đá': 'sports',
    'football': 'sports',
    'sports': 'sports',
    'workshop': 'workshop',
    'seminar': 'seminar',
    'conference': 'conference',
    'festival': 'festival',
    'lễ hội': 'festival',
    'triển lãm': 'exhibition',
    'exhibition': 'exhibition',
    'theater': 'theater',
    'kịch': 'theater',
    'sân khấu': 'theater'
  };
  
  // Tìm category trong message
  for (const [keyword, category] of Object.entries(categoryMapping)) {
    if (lowerMessage.includes(keyword)) {
      console.log('🎵 Found category:', keyword, '→', category);
      return category;
    }
  }
  
  return null;
};

router.post('/openai-chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
        console.log('💬 User message:', message);
    
    // Nhận diện địa điểm và category
    const location = extractLocation(message);
    const category = extractCategory(message);
    let events = [];
    let eventContext = '';
    
    console.log('🎯 Location detected:', location);
    console.log('🎵 Category detected:', category);
    
    // Tìm sự kiện dựa trên location và category
    if (location && category) {
      console.log('🔍 Searching by location AND category');
      events = await searchEventsByLocationAndCategory(location, category);
    } else if (location) {
      console.log('🔍 Searching by location only');
      events = await searchEventsByLocation(location);
    } else if (category) {
      console.log('🔍 Searching by category only');
      events = await searchEventsByCategory(category);
    }
    
    eventContext = createEventContext(events);
    console.log('📝 Event context:', eventContext);
    
    // Tạo system prompt
    let systemPrompt = 'Bạn là một trợ lý AI thân thiện, luôn trả lời bằng tiếng Việt.';
    
    if (events.length > 0) {
      let searchDescription = '';
      if (location && category) {
        searchDescription = `sự kiện ${category} ở ${location}`;
      } else if (location) {
        searchDescription = `sự kiện ở ${location}`;
      } else if (category) {
        searchDescription = `sự kiện ${category}`;
      }
      
      systemPrompt += `\n\nDỮ LIỆU SỰ KIỆN THỰC TẾ TỪ DATABASE (${searchDescription}):

${eventContext}

HƯỚNG DẪN: 
- CHỈ sử dụng thông tin sự kiện từ database ở trên
- KHÔNG ĐƯỢC bịa thêm sự kiện hoặc thông tin không có trong database
- Giới thiệu chi tiết các sự kiện thực tế từ database cho người dùng
- Nếu sự kiện có tags "music" hoặc "concert", đó là sự kiện âm nhạc
- Nếu sự kiện có tags "sports", đó là sự kiện thể thao
- Nếu có sự kiện trong danh sách trên, BẮT BUỘC phải giới thiệu sự kiện đó`;
      
      console.log('🤖 System prompt with events');
    } else {
      let noEventMessage = '';
      if (location && category) {
        noEventMessage = `Hiện tại không có sự kiện ${category} nào ở ${location}`;
      } else if (location) {
        noEventMessage = `Hiện tại không có sự kiện nào ở ${location}`;
      } else if (category) {
        noEventMessage = `Hiện tại không có sự kiện ${category} nào`;
      } else {
        noEventMessage = `Hiện tại không có sự kiện nào phù hợp`;
      }
      
      systemPrompt += `\n\nHƯỚNG DẪN: ${noEventMessage}. Hãy thông báo điều này cho người dùng.`;
      
      console.log('🤖 System prompt - no events found');
    }
    
    // Gọi OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return res.status(500).json({ error: 'OpenAI API error' });
    }
    
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Xin lỗi, tôi không thể trả lời lúc này.';
    console.log('🤖 AI Response:', reply);
    
    res.json({ reply });
    
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;