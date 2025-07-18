// Test script to check if useFixedLayout variable is defined properly
const eventController = require('./controllers/eventController');

// Mock function to test variable definitions
function testCreateEventWithSeating() {
  try {
    // Define a complete test body with all required fields
    const testBody = {
      title: "Test Event with Seating",
      description: "This is a test event for seating functionality",
      startDate: new Date(Date.now() + 86400000), // Tomorrow
      endDate: new Date(Date.now() + 172800000),  // Day after tomorrow
      location: {
        type: "venue",
        venueLayout: "theater",
        address: "123 Test Street",
        city: "Test City",
        country: "Test Country"
      },
      price: 100,
      capacity: 200,
      category: ["music", "entertainment"],
      status: "draft",
      seatingMap: {
        layoutType: 'theater',
        sections: [],
        stage: { x: 400, y: 80, width: 400, height: 100 },
        venueObjects: []
      },
      ticketTypes: [
        {
          name: "Standard",
          price: 100,
          totalQuantity: 100,
          availableQuantity: 100,
          description: "Standard ticket",
          color: "#3B82F6"
        },
        {
          name: "VIP",
          price: 200,
          totalQuantity: 50,
          availableQuantity: 50,
          description: "VIP ticket",
          color: "#EF4444"
        }
      ]
    };
    
    // Create a mock request object
    const req = {
      user: { _id: '123456789012345678901234' },
      body: testBody
    };
    
    // Create a mock response object
    const res = {
      status: (code) => {
        console.log(`Response status: ${code}`);
        return res;
      },
      json: (data) => {
        console.log('Response data:', JSON.stringify(data));
        return res;
      }
    };
    
    console.log('Testing createEventWithSeating function...');
    // Call the function - if there's an issue with variable declarations, it will fail
    eventController.createEventWithSeating(req, res);
    
    console.log('Function executed without variable declaration errors.');
  } catch (error) {
    console.error('Error testing function:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testCreateEventWithSeating(); 