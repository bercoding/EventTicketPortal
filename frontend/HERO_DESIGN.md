# Thiết kế Hero Section với Video Background - EventHub

## Tổng quan
Trang chủ đã được thiết kế lại hoàn toàn với video background tự động chạy, tạo ra trải nghiệm người dùng ấn tượng và hiện đại.

## Tính năng chính

### 🎥 Video Background
- **Tự động phát**: Video chạy ngay khi trang được tải
- **Loop liên tục**: Video lặp lại không ngừng
- **Multiple sources**: Hỗ trợ nhiều video để fallback
- **Controls**: Nút play/pause và mute/unmute
- **Responsive**: Tự động điều chỉnh theo kích thước màn hình

### 🎨 Thiết kế hiện đại
- **Glass morphism**: Hiệu ứng kính mờ cho controls
- **Gradient overlays**: Tạo độ sâu và tương phản
- **Smooth animations**: Chuyển động mượt mà
- **Responsive typography**: Text tự động điều chỉnh

### ⚡ Performance
- **Lazy loading**: Video chỉ tải khi cần thiết
- **Error handling**: Fallback khi video lỗi
- **Optimized sources**: Sử dụng CDN cho video

## Cấu trúc Components

### 1. VideoBackground Component
```javascript
<VideoBackground 
    videoSources={videoSources}
    overlayOpacity={0.6}
    filter="brightness(0.7) contrast(1.1)"
    showControls={true}
>
    {/* Content */}
</VideoBackground>
```

**Props:**
- `videoSources`: Array các URL video
- `overlayOpacity`: Độ trong suốt của overlay
- `filter`: CSS filter cho video
- `showControls`: Hiển thị controls hay không

### 2. HeroSection Component
```javascript
<HeroSection user={user} />
```

**Features:**
- Logo với animation
- Tagline và description
- CTA buttons với hover effects
- Scroll indicator

## Video Sources

### Danh sách video mặc định:
1. **Concert Crowd**: Đám đông tại concert
2. **People Waving**: Mọi người vẫy tay
3. **Audience Watching**: Khán giả xem biểu diễn
4. **Concert Atmosphere**: Không khí concert

### Fallback Strategy:
- Nếu video đầu tiên lỗi → chuyển sang video tiếp theo
- Nếu tất cả video lỗi → hiển thị gradient background
- Tự động retry khi có lỗi network

## Animations

### 1. Icon Animations
- **Fire Icon**: Pulse animation
- **Star Icon**: Bounce animation
- **Button Icons**: Rotate on hover

### 2. Text Animations
- **Title**: Gradient shift animation
- **Tagline**: Fade in effect
- **Description**: Slide up animation

### 3. Button Effects
- **Hover**: Scale và glow effect
- **Icon rotation**: 12deg rotation
- **Shadow**: Dynamic shadow

### 4. Scroll Indicator
- **Continuous bounce**: Hướng dẫn scroll
- **Pulse effect**: Thu hút sự chú ý

## Responsive Design

### Mobile (< 768px)
- Title: 3rem
- Tagline: 1.25rem
- Description: 1rem
- Single column layout

### Tablet (769px - 1024px)
- Title: 5rem
- Tagline: 1.75rem
- Description: 1.125rem
- Two column layout

### Desktop (> 1025px)
- Title: 6rem
- Tagline: 2rem
- Description: 1.25rem
- Full layout

## CSS Classes

### Animation Classes
```css
.hero-fire-icon     /* Pulse animation */
.hero-star-icon     /* Bounce animation */
.hero-title         /* Gradient shift */
.hero-button        /* Glow effect */
.hero-button-icon   /* Rotation */
.scroll-indicator   /* Bounce */
```

### Responsive Classes
```css
.hero-tagline       /* Responsive font size */
.hero-description   /* Responsive font size */
```

### Glass Effect
```css
.glass-control      /* Backdrop blur */
```

## Browser Support

### ✅ Fully Supported
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### ⚠️ Partial Support
- IE 11 (fallback to static background)
- Older mobile browsers (reduced animations)

## Performance Tips

### 1. Video Optimization
- Sử dụng MP4 format
- Compress video size
- CDN hosting
- Multiple quality levels

### 2. Loading Strategy
- Preload first video
- Lazy load others
- Progressive enhancement

### 3. Fallback Plan
- Static gradient background
- Animated CSS background
- Image background

## Customization

### Thay đổi video sources:
```javascript
const customVideoSources = [
    'your-video-1.mp4',
    'your-video-2.mp4',
    'your-video-3.mp4'
];
```

### Thay đổi overlay:
```javascript
<VideoBackground 
    overlayOpacity={0.8}  // Tăng độ tối
    filter="brightness(0.5) contrast(1.2)"  // Thay đổi filter
>
```

### Thay đổi animations:
```css
.hero-title {
    animation-duration: 5s;  // Chậm hơn
    animation-timing-function: ease-in-out;
}
```

## Troubleshooting

### Video không phát:
1. Kiểm tra URL video
2. Kiểm tra CORS policy
3. Kiểm tra browser autoplay policy
4. Thử video khác

### Performance issues:
1. Giảm video quality
2. Sử dụng CDN
3. Enable video compression
4. Check network speed

### Mobile issues:
1. Kiểm tra autoplay policy
2. Test trên device thật
3. Optimize video size
4. Check touch interactions 