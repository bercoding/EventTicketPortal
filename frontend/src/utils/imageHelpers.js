// Utility functions for handling images and placeholders

// Get placeholder image for events
export const getEventPlaceholder = () => {
  return 'https://via.placeholder.com/400x200/6366f1/ffffff?text=Event';
};

// Get placeholder image for avatars
export const getAvatarPlaceholder = () => {
  return 'https://via.placeholder.com/150x150/6366f1/ffffff?text=User';
};

// Handle image error by setting placeholder
export const handleImageError = (e, type = 'event') => {
  e.target.onerror = null; // Prevent infinite loop
  if (type === 'avatar') {
    e.target.src = getAvatarPlaceholder();
  } else {
    e.target.src = getEventPlaceholder();
  }
};

// Get image URL with fallback
export const getImageWithFallback = (imageUrl, type = 'event') => {
  if (!imageUrl || imageUrl.trim() === '') {
    return type === 'avatar' ? getAvatarPlaceholder() : getEventPlaceholder();
  }
  return imageUrl;
}; 