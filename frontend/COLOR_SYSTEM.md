# Hệ thống màu sắc Pastel Blue - EventHub

## Tổng quan
Hệ thống màu sắc đã được đồng bộ hóa thành màu xanh biển pastel nhẹ nhàng và màu trắng để tạo ra trải nghiệm người dùng nhất quán và dễ chịu.

## Bảng màu chính

### Pastel Blue Palette
- `pastel-50`: #f0f8ff (Very light pastel blue - Background chính)
- `pastel-100`: #e0f2fe (Light pastel blue - Background phụ)
- `pastel-200`: #bae6fd (Soft pastel blue - Border, accent nhẹ)
- `pastel-300`: #7dd3fc (Medium pastel blue - Hover states)
- `pastel-400`: #38bdf8 (Pastel blue - Accent)
- `pastel-500`: #0ea5e9 (Primary pastel blue - Buttons, links)
- `pastel-600`: #0284c7 (Darker pastel blue - Hover buttons)
- `pastel-700`: #0369a1 (Deep pastel blue - Active states)
- `pastel-800`: #075985 (Very deep pastel blue - Text)
- `pastel-900`: #0c4a6e (Darkest pastel blue - Headings)

### White Variations
- `pure-50`: #ffffff (Pure white)
- `pure-100`: #fefefe (Slightly off-white)
- `pure-200`: #fdfdfd (Very light gray-white)
- `pure-300`: #fcfcfc (Light gray-white)
- `pure-400`: #fafafa (Gray-white)
- `pure-500`: #f8f8f8 (Medium gray-white)
- `pure-600`: #f5f5f5 (Darker gray-white)
- `pure-700`: #f0f0f0 (Gray)
- `pure-800`: #e8e8e8 (Darker gray)
- `pure-900`: #e0e0e0 (Darkest gray)

## Cách sử dụng

### Background Colors
```css
.bg-primary    /* #f0f8ff - Background chính */
.bg-secondary  /* #e0f2fe - Background phụ */
.bg-accent     /* #bae6fd - Accent background */
.bg-surface    /* #ffffff - Surface elements */
.bg-card       /* #fefefe - Card backgrounds */
```

### Text Colors
```css
.text-primary  /* #0c4a6e - Text chính */
.text-secondary /* #075985 - Text phụ */
.text-accent   /* #0ea5e9 - Accent text */
.text-muted    /* #64748b - Muted text */
```

### Border Colors
```css
.border-primary  /* #bae6fd - Border chính */
.border-secondary /* #7dd3fc - Border phụ */
.border-accent   /* #0ea5e9 - Accent border */
```

## Các component đã được cập nhật

### 1. Navigation Bar
- Background gradient: `from-pastel-500 to-pastel-600`
- Text: White
- Hover states: `pastel-100`

### 2. Event Cards
- Background: White
- Border: `pastel-200`
- Hover effects: `pastel-600` text
- Shadow: Pastel blue tinted

### 3. Forms (Login/Register)
- Background: `pastel-50` to `pastel-200` gradient
- Input borders: `pastel-200`
- Focus states: `pastel-500`
- Buttons: `pastel-600` to `pastel-700` gradient

### 4. Seating Designer
- Background: `pastel-50`
- Toolbar: `pastel-100`
- Canvas: `pastel-50`
- Buttons: White with `pastel-200` borders
- Hover: `pastel-100` background

### 5. Admin Dashboard
- Stats cards: Mixed colors (giữ nguyên để phân biệt)
- Primary stats: `pastel-500` to `pastel-600`
- Background: `pastel-50`

## Lưu ý quan trọng

1. **Buttons màu**: Theo yêu cầu, các button màu (success, danger, warning) vẫn giữ nguyên màu gốc để phân biệt chức năng.

2. **Accessibility**: Tất cả màu sắc đều đảm bảo contrast ratio đủ để dễ đọc.

3. **Consistency**: Tất cả component đều sử dụng cùng một bảng màu để tạo sự nhất quán.

4. **Performance**: Sử dụng CSS custom properties và Tailwind utilities để tối ưu performance.

## Cách thêm màu mới

Để thêm màu mới vào hệ thống, cập nhật file `tailwind.config.js`:

```javascript
colors: {
  'pastel': {
    // Thêm màu mới vào đây
  }
}
```

Sau đó rebuild CSS để áp dụng thay đổi. 