// Utility functions for handling event data

// Format date and time with null protection
export const formatDateTime = (dateString) => {
  console.log('🔧 formatDateTime called with:', dateString);
  if (!dateString || dateString === 'Invalid Date' || isNaN(new Date(dateString))) {
    console.log('🔧 formatDateTime returning fallback');
    return 'Thời gian sẽ được cập nhật';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log('🔧 formatDateTime invalid date, returning fallback');
      return 'Thời gian sẽ được cập nhật';
    }
    
    const result = date.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    console.log('🔧 formatDateTime result:', result);
    return result;
  } catch (error) {
    console.log('🔧 formatDateTime error:', error);
    return 'Thời gian sẽ được cập nhật';
  }
};

// Format date only
export const formatDate = (dateString) => {
  console.log('🔧 formatDate called with:', dateString);
  if (!dateString || dateString === 'Invalid Date' || isNaN(new Date(dateString))) {
    console.log('🔧 formatDate returning fallback');
    return 'Ngày sẽ được cập nhật';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log('🔧 formatDate invalid date, returning fallback');
      return 'Ngày sẽ được cập nhật';
    }
    
    const result = date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    console.log('🔧 formatDate result:', result);
    return result;
  } catch (error) {
    console.log('🔧 formatDate error:', error);
    return 'Ngày sẽ được cập nhật';
  }
};

// Format time only
export const formatTime = (dateString) => {
  console.log('🔧 formatTime called with:', dateString);
  if (!dateString || dateString === 'Invalid Date' || isNaN(new Date(dateString))) {
    console.log('🔧 formatTime returning fallback');
    return 'TBA';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log('🔧 formatTime invalid date, returning fallback');
      return 'TBA';
    }
    
    const result = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    console.log('🔧 formatTime result:', result);
    return result;
  } catch (error) {
    console.log('🔧 formatTime error:', error);
    return 'TBA';
  }
};

// Format price with currency
export const formatPrice = (price) => {
  console.log('🔧 formatPrice called with:', price);
  if (!price || isNaN(price) || price <= 0) {
    console.log('🔧 formatPrice returning free');
    return 'Miễn phí';
  }
  
  try {
    const result = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
    console.log('🔧 formatPrice result:', result);
    return result;
  } catch (error) {
    console.log('🔧 formatPrice error:', error);
    return `${price.toLocaleString('vi-VN')} VNĐ`;
  }
};

// Get price range from tickets
export const getPriceRange = (ticketTypes) => {
  console.log('🔧 getPriceRange called with:', ticketTypes);
  if (!ticketTypes || !Array.isArray(ticketTypes) || ticketTypes.length === 0) {
    console.log('🔧 getPriceRange no ticket types, returning contact');
    return 'Liên hệ để biết giá';
  }

  // Handle both populated and unpopulated ticketTypes
  let prices = [];
  
  if (typeof ticketTypes[0] === 'string') {
    // Unpopulated ticketTypes (just IDs)
    console.log('🔧 getPriceRange unpopulated ticket types');
    return 'Liên hệ để biết giá';
  }
  
  // Populated ticketTypes
  ticketTypes.forEach(ticket => {
    if (ticket && ticket.price && !isNaN(ticket.price) && ticket.price > 0) {
      prices.push(ticket.price);
    }
  });

  console.log('🔧 getPriceRange extracted prices:', prices);

  if (prices.length === 0) {
    console.log('🔧 getPriceRange no valid prices, returning free');
    return 'Miễn phí';
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    const result = formatPrice(minPrice);
    console.log('🔧 getPriceRange single price result:', result);
    return result;
  }

  const result = `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  console.log('🔧 getPriceRange range result:', result);
  return result;
};

// Get available tickets count
export const getAvailableTickets = (event) => {
  if (!event) {
    return 0;
  }

  // Check if ticketTypes exist and are populated
  if (event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0) {
    // If populated ticketTypes
    if (typeof event.ticketTypes[0] === 'object' && event.ticketTypes[0].quantity !== undefined) {
      return event.ticketTypes.reduce((total, ticket) => {
        const quantity = ticket.quantity || 0;
        const sold = ticket.sold || 0;
        return total + Math.max(0, quantity - sold);
      }, 0);
    }
  }

  // Fallback to event capacity
  if (event.capacity && !isNaN(event.capacity)) {
    const sold = event.soldTickets || 0;
    return Math.max(0, event.capacity - sold);
  }

  return 0;
};

// Get ticket availability status
export const getTicketStatus = (event) => {
  const available = getAvailableTickets(event);
  const capacity = event.capacity || 0;
  
  if (available <= 0) {
    return { status: 'sold-out', label: 'Hết vé', className: 'bg-red-100 text-red-800' };
  }
  
  if (capacity > 0 && available <= capacity * 0.1) {
    return { status: 'low-stock', label: 'Sắp hết vé', className: 'bg-yellow-100 text-yellow-800' };
  }
  
  return { status: 'available', label: `${available} vé còn lại`, className: 'bg-green-100 text-green-800' };
};

// Get event location display
export const getLocationDisplay = (event) => {
  if (!event || !event.location) {
    return 'Địa điểm sẽ được cập nhật';
  }

  const { location } = event;
  
  if (location.type === 'online') {
    return `Online - ${location.platform || 'Platform TBA'}`;
  }
  
  if (location.type === 'offline') {
    const parts = [];
    if (location.venue) parts.push(location.venue);
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }
  
  return 'Địa điểm sẽ được cập nhật';
};

// Check if event is upcoming
export const isUpcoming = (startDate) => {
  if (!startDate || isNaN(new Date(startDate))) {
    return true; // Assume upcoming if no valid date
  }
  
  try {
    const now = new Date();
    const eventDate = new Date(startDate);
    return eventDate > now;
  } catch (error) {
    return true;
  }
};

// Get event status
export const getEventStatus = (event) => {
  if (!event) return 'Sắp diễn ra';
  
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  if (isNaN(startDate)) return 'Sắp diễn ra';
  
  if (now < startDate) {
    return 'Sắp diễn ra';
  } else if (!isNaN(endDate) && now > endDate) {
    return 'Đã kết thúc';
  } else {
    return 'Đang diễn ra';
  }
};

// Get event duration
export const getEventDuration = (startDate, endDate) => {
  if (!startDate || isNaN(new Date(startDate))) {
    return 'Thời lượng TBA';
  }
  
  if (!endDate || isNaN(new Date(endDate))) {
    return 'Thời lượng TBA';
  }
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} giờ`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `${diffDays} ngày`;
    }
  } catch (error) {
    return 'Thời lượng TBA';
  }
}; 