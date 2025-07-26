# Sửa lỗi tự động tạo sự kiện khi setup sân khấu

## Vấn đề
Khi event owner tạo sự kiện loại có ghế ngồi và bấm vào các vật thể (stage, venue objects) để setup sân khấu, hệ thống tự động tạo sự kiện mà không cần người dùng nhấn nút "Tạo sự kiện".

## Nguyên nhân
Vấn đề xảy ra do các event handlers trong `BasicSeatingDesigner` không có `preventDefault()` và `stopPropagation()` đầy đủ, khiến các event có thể bubble up đến form và trigger việc submit form không mong muốn.

## Giải pháp đã áp dụng

### 1. Thêm preventDefault và stopPropagation cho tất cả event handlers

#### BasicSeatingDesigner.js
- Thêm `preventDefault()` và `stopPropagation()` cho:
  - `selectElement()`
  - `handleDragStart()`
  - `handleGlobalMouseMove()`
  - `handleGlobalMouseUp()`
  - `handleCanvasClick()`
  - `addSection()`
  - `addVenueObject()`
  - `deleteSelected()`
  - `undo()`
  - `redo()`
  - `showDebugInfo()`

#### PropertyEditor.js
- Thêm `preventDefault()` và `stopPropagation()` cho:
  - `handleChange()`
  - Tất cả các input fields (text, number, color, select)

#### ObjectToolbar.js
- Thêm `preventDefault()` và `stopPropagation()` cho:
  - `handleAddObject()`
  - `toggleExpand()`
  - Tất cả các button clicks

### 2. Thêm biện pháp bảo vệ form

#### CreateEventWithSeating.js
- Thêm kiểm tra nguồn gốc của form submit
- Chỉ cho phép submit từ nút có class `submit-button`
- Ngăn chặn submit khi nhấn Enter

#### NavigationButtons.js
- Thêm class `submit-button` cho nút submit
- Cải thiện event handling để tránh bubble up

### 3. Thêm biện pháp bảo vệ container

#### BasicSeatingDesigner.js
- Thêm `onClick` và `onKeyDown` handlers cho container chính
- Ngăn chặn tất cả các event không mong muốn

#### PropertyEditor.js
- Thêm `onClick` và `onKeyDown` handlers cho container
- Ngăn chặn việc submit form

#### ObjectToolbar.js
- Thêm `onClick` và `onKeyDown` handlers cho container
- Ngăn chặn việc submit form

## Kết quả
- ✅ Ngăn chặn việc tự động tạo sự kiện khi click vào các vật thể
- ✅ Vẫn giữ nguyên chức năng drag & drop và chỉnh sửa thuộc tính
- ✅ Cải thiện UX bằng cách chỉ cho phép submit form từ nút chính thức
- ✅ Thêm logging để debug và theo dõi các event

## Cách test
1. Đăng nhập với role event owner
2. Tạo sự kiện mới với loại "có ghế ngồi"
3. Đi đến bước 3 (thiết kế sơ đồ)
4. Click vào stage, venue objects, hoặc các input fields
5. Kiểm tra xem sự kiện có được tạo tự động không
6. Chỉ nên tạo sự kiện khi nhấn nút "Tạo sự kiện"

## Files đã sửa
- `frontend/src/components/seating/BasicSeatingDesigner.js`
- `frontend/src/components/seating/PropertyEditor.js`
- `frontend/src/components/seating/ObjectToolbar.js`
- `frontend/src/pages/event/CreateEventWithSeating.js`
- `frontend/src/components/event/NavigationButtons.js` 