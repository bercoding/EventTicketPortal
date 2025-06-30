const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test data cho general event
const testEventData = {
  title: 'Workshop trồng hoa TEST',
  description: 'Học cách trồng và chăm sóc hoa',
  startDate: '2024-12-20T10:00:00Z',
  endDate: '2024-12-20T16:00:00Z',
  location: {
    type: 'offline',
    venueName: 'Công viên Tao Đàn',
    address: '123 Trương Định',
    ward: 'Phường 6',
    district: 'Quận 3',
    city: 'Hồ Chí Minh',
    country: 'Vietnam'
  },
  category: ['workshop'],
  tags: ['garden', 'flowers'],
  capacity: 50,
  visibility: 'public',
  status: 'pending',
  detailedDescription: {
    mainProgram: 'Học trồng hoa',
    guests: 'Chuyên gia vườn',
    specialExperiences: 'Tự tay trồng'
  },
  termsAndConditions: 'Mang theo dụng cụ',
  organizer: {
    name: 'Vườn Hoa Đẹp',
    info: 'Chuyên gia trồng hoa'
  },
  ticketTypes: [
    {
      name: 'Vé thường',
      price: 100000,
      totalQuantity: 30,
      availableQuantity: 30,
      description: 'Vé tham gia workshop'
    },
    {
      name: 'Vé VIP',
      price: 200000,
      totalQuantity: 20,
      availableQuantity: 20,
      description: 'Vé VIP với kit trồng hoa'
    }
  ],
  templateType: 'general'
};

async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'owner@example.com',
      password: 'password123'
    });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function createTestEvent() {
  try {
    console.log('🔐 Getting auth token...');
    const token = await getAuthToken();
    
    console.log('📝 Creating general event...');
    console.log('Event data:', JSON.stringify(testEventData, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/events/create-with-seating`,
      testEventData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Event created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error creating event:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

createTestEvent(); 