const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const Event = require('../models/Event');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Đổi tên biến môi trường cho rõ ràng

// Function để tìm kiếm sự kiện từ database
const searchEvents = async (searchCriteria) => {
  try {
    const query = { status: 'approved' };
    
    // Tìm kiếm theo từ khóa
    if (searchCriteria.keywords) {
      query.$or = [
        { title: { $regex: searchCriteria.keywords, $options: 'i' } },
        { description: { $regex: searchCriteria.keywords, $options: 'i' } },
        { tags: { $in: [new RegExp(searchCriteria.keywords, 'i')] } }
      ];
    }
    
    // Tìm kiếm theo category
    if (searchCriteria.category) {
      query.category = { $in: Array.isArray(searchCriteria.category) ? searchCriteria.category : [searchCriteria.category] };
    }
    
    // Tìm kiếm theo location
    if (searchCriteria.location) {
      query.$or = query.$or || [];
      query.$or.push(
        { 'location.city': { $regex: searchCriteria.location, $options: 'i' } },
        { 'location.district': { $regex: searchCriteria.location, $options: 'i' } },
        { 'location.address': { $regex: searchCriteria.location, $options: 'i' } }
      );
    }
    
    // Lọc sự kiện sắp diễn ra
    if (searchCriteria.upcoming) {
      query.startDate = { $gte: new Date() };
    }
    
    // Lọc theo featured/trending/special
    if (searchCriteria.featured) query.featured = true;
    if (searchCriteria.trending) query.trending = true;
    if (searchCriteria.special) query.special = true;
    
    const events = await Event.find(query)
      .populate('organizers', 'username fullName avatar')
      .populate('ticketTypes')
      .limit(searchCriteria.limit || 5)
      .sort({ startDate: 1 });
    
    return events;
  } catch (error) {
    console.error('Error searching events:', error);
    return [];
  }
};

// Function để tạo context về sự kiện cho AI
const createEventContext = (events) => {
  if (!events || events.length === 0) {
    return "Hiện tại không có sự kiện nào phù hợp với yêu cầu của bạn.";
  }
  
  let context = "Dưới đây là các sự kiện phù hợp:\n\n";
  
  events.forEach((event, index) => {
    const startDate = new Date(event.startDate).toLocaleDateString('vi-VN');
    const ticketTypes = event.ticketTypes?.map(tt => `${tt.name}: ${tt.price?.toLocaleString()}đ`) || [];
    
    context += `${index + 1}. **${event.title}**\n`;
    context += `   📅 Ngày: ${startDate}\n`;
    context += `   📍 Địa điểm: ${event.location.venueName || event.location.address || 'Chưa cập nhật'}\n`;
    if (event.location.city) context += `   🏙️ Thành phố: ${event.location.city}\n`;
    if (event.category && event.category.length > 0) {
      context += `   🏷️ Danh mục: ${event.category.join(', ')}\n`;
    }
    if (ticketTypes.length > 0) {
      context += `   💰 Giá vé: ${ticketTypes.join(', ')}\n`;
    }
    if (event.description) {
      context += `   📝 Mô tả: ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}\n`;
    }
    context += `   🔗 ID: ${event._id}\n\n`;
  });
  
  return context;
};

router.post('/openai-chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  
  try {
    // Phân tích tin nhắn để tìm kiếm sự kiện
    const lowerMessage = message.toLowerCase();
    let searchCriteria = {};
    
    // Tìm kiếm theo từ khóa
    if (lowerMessage.includes('sự kiện') || lowerMessage.includes('event') || 
        lowerMessage.includes('concert') || lowerMessage.includes('show') ||
        lowerMessage.includes('festival') || lowerMessage.includes('workshop') ||
        lowerMessage.includes('seminar') || lowerMessage.includes('conference')) {
      
      // Extract keywords từ tin nhắn
      const keywords = message.match(/[\wÀ-ỹ]+/g)?.filter(word => 
        word.length > 2 && !['có', 'nào', 'đang', 'sắp', 'diễn', 'ra', 'ở', 'tại', 'cho', 'với', 'và', 'hoặc'].includes(word.toLowerCase())
      ).slice(0, 3) || [];
      
      if (keywords.length > 0) {
        searchCriteria.keywords = keywords.join(' ');
      }
      
      // Tìm kiếm theo location
      const locationKeywords = ['hà nội', 'hanoi', 'tp.hcm', 'ho chi minh', 'đà nẵng', 'danang', 'hải phòng', 'haiphong'];
      const foundLocation = locationKeywords.find(loc => lowerMessage.includes(loc));
      if (foundLocation) {
        searchCriteria.location = foundLocation;
      }
      
      // Tìm kiếm theo category
      const categoryKeywords = {
        'âm nhạc': 'music',
        'concert': 'music', 
        'nhạc': 'music',
        'thể thao': 'sports',
        'football': 'sports',
        'bóng đá': 'sports',
        'workshop': 'workshop',
        'seminar': 'seminar',
        'conference': 'conference',
        'festival': 'festival'
      };
      
      for (const [keyword, category] of Object.entries(categoryKeywords)) {
        if (lowerMessage.includes(keyword)) {
          searchCriteria.category = category;
          break;
        }
      }
      
      // Mặc định tìm sự kiện sắp diễn ra
      searchCriteria.upcoming = true;
      searchCriteria.limit = 5;
    }
    
    // Tìm kiếm sự kiện từ database
    const events = await searchEvents(searchCriteria);
    const eventContext = createEventContext(events);
    
    // Tạo system prompt với context sự kiện
    const systemPrompt = `Bạn là một trợ lý AI thân thiện chuyên về sự kiện. 
    
Khi người dùng hỏi về sự kiện, hãy sử dụng thông tin sự kiện thực tế từ database:

${eventContext}

Hướng dẫn:
1. Nếu có sự kiện phù hợp, hãy giới thiệu chi tiết và gợi ý người dùng tham gia
2. Nếu không có sự kiện phù hợp, hãy gợi ý các loại sự kiện khác hoặc thời gian khác
3. Luôn trả lời bằng tiếng Việt một cách thân thiện và hữu ích
4. Nếu người dùng hỏi về sự kiện cụ thể, hãy tìm kiếm và cung cấp thông tin chi tiết`;

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
      console.error('OpenAI API response error:', data);
    }
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Xin lỗi, tôi không thể trả lời lúc này.';
    res.json({ reply });
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: 'OpenAI API error' });
  }
});

module.exports = router;