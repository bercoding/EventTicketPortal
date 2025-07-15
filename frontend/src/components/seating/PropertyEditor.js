import React from 'react';

const PropertyEditor = ({ selectedElement, localMap, onUpdate, ticketTypes = [] }) => {
  if (!selectedElement) {
    return (
      <div className="property-editor">
        <div className="property-editor-header">Thuộc tính</div>
        <div className="property-editor-empty">
          Chọn một phần tử để chỉnh sửa thuộc tính
        </div>
      </div>
    );
  }

  const getElement = () => {
    if (selectedElement.type === 'stage') {
      return localMap.stage;
    } else if (selectedElement.type === 'section') {
      return localMap.sections.find(s => s.id === selectedElement.id);
    } else if (selectedElement.type === 'venueObject') {
      return localMap.venueObjects.find(o => o.id === selectedElement.id);
    }
    return null;
  };

  const element = getElement();

  if (!element) {
    return (
      <div className="property-editor">
        <div className="property-editor-header">Thuộc tính</div>
        <div className="property-editor-empty">
          Không tìm thấy phần tử
        </div>
      </div>
    );
  }

  // Helper to generate row structure compatible with MongoDB schema
  const generateRowsData = (numRows, seatsPerRow) => {
    // Limit the number of rows and seats to prevent payload issues
    const limitedRows = Math.min(numRows, 15); // Reduce from original
    const limitedSeatsPerRow = Math.min(seatsPerRow, 30); // Reduce from original
    
    const rows = [];
    for (let i = 0; i < limitedRows; i++) {
      const rowName = String.fromCharCode(65 + i); // A, B, C...
      const seats = [];
      
      for (let j = 0; j < limitedSeatsPerRow; j++) {
        seats.push({
          number: `${j + 1}`,
          status: 'available',
          x: j * 20,
          y: i * 20
        });
      }
      
      rows.push({
        name: rowName,
        seats: seats
      });
    }
    return rows;
  };

  const handleChange = (field, value) => {
    const updatedElement = { ...element };
    
    // Xử lý đặc biệt cho trường rows và seatsPerRow
    if (field === 'rows' || field === 'seatsPerRow') {
      const numRows = field === 'rows' ? value : element.rows;
      const seatsPerRow = field === 'seatsPerRow' ? value : element.seatsPerRow;
      
      // Chỉ cập nhật rows nếu là section
      if (selectedElement.type === 'section') {
        updatedElement[field] = value; // Giữ giá trị số làm thuộc tính
      }
    } else {
      updatedElement[field] = value;
    }
    
    let updatedMap;
    if (selectedElement.type === 'stage') {
      updatedMap = {
        ...localMap,
        stage: updatedElement
      };
    } else if (selectedElement.type === 'section') {
      updatedMap = {
        ...localMap,
        sections: localMap.sections.map(s => 
          s.id === selectedElement.id ? updatedElement : s
        )
      };
    } else if (selectedElement.type === 'venueObject') {
      updatedMap = {
        ...localMap,
        venueObjects: localMap.venueObjects.map(o => 
          o.id === selectedElement.id ? updatedElement : o
        )
      };
    }
    
    if (updatedMap) {
      onUpdate(updatedMap);
    }
  };

  // Render các trường chỉnh sửa dựa trên loại phần tử
  const renderFields = () => {
    switch (selectedElement.type) {
      case 'stage':
        return (
          <>
            <div className="property-field">
              <label>Tên:</label>
              <input 
                type="text" 
                value={element.name || 'Sân khấu'} 
                onChange={(e) => handleChange('name', e.target.value)} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Chiều rộng:</label>
              <input 
                type="number" 
                value={element.width} 
                onChange={(e) => handleChange('width', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Chiều cao:</label>
              <input 
                type="number" 
                value={element.height} 
                onChange={(e) => handleChange('height', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>X:</label>
              <input 
                type="number" 
                value={Math.round(element.x)} 
                onChange={(e) => handleChange('x', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Y:</label>
              <input 
                type="number" 
                value={Math.round(element.y)} 
                onChange={(e) => handleChange('y', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
          </>
        );
      
      case 'section':
        return (
          <>
            <div className="property-field">
              <label>Tên:</label>
              <input 
                type="text" 
                value={element.name} 
                onChange={(e) => handleChange('name', e.target.value)} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Chiều rộng:</label>
              <input 
                type="number" 
                value={element.width} 
                onChange={(e) => handleChange('width', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Chiều cao:</label>
              <input 
                type="number" 
                value={element.height} 
                onChange={(e) => handleChange('height', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>X:</label>
              <input 
                type="number" 
                value={Math.round(element.x)} 
                onChange={(e) => handleChange('x', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Y:</label>
              <input 
                type="number" 
                value={Math.round(element.y)} 
                onChange={(e) => handleChange('y', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Số hàng:</label>
              <input 
                type="number" 
                value={element.rows || 10}
                min={1}
                max={15} 
                onChange={(e) => {
                  const value = Math.min(Number(e.target.value), 15);
                  handleChange('rows', value);
                }} 
                className="seating-designer-input"
              />
              {(element.rows || 0) > 15 && (
                <div className="property-warning">
                  Vì lý do hiệu suất, số hàng tối đa là 15
                </div>
              )}
            </div>
            <div className="property-field">
              <label>Ghế mỗi hàng:</label>
              <input 
                type="number" 
                value={element.seatsPerRow || 15} 
                min={1}
                max={30}
                onChange={(e) => {
                  const value = Math.min(Number(e.target.value), 30);
                  handleChange('seatsPerRow', value);
                }} 
                className="seating-designer-input"
              />
              {(element.seatsPerRow || 0) > 30 && (
                <div className="property-warning">
                  Vì lý do hiệu suất, số ghế tối đa mỗi hàng là 30
                </div>
              )}
            </div>
            <div className="property-field">
              <label>Loại vé:</label>
              <select 
                value={element.ticketTypeId || ''} 
                onChange={(e) => handleChange('ticketTypeId', e.target.value)} 
                className="seating-designer-select"
              >
                <option value="">Chọn loại vé</option>
                {ticketTypes.map(type => (
                  <option key={type._id} value={type._id}>
                    {type.name} - {type.price.toLocaleString('vi-VN')}đ
                  </option>
                ))}
              </select>
            </div>
          </>
        );
      
      case 'venueObject':
        return (
          <>
            <div className="property-field">
              <label>Nhãn:</label>
              <input 
                type="text" 
                value={element.label} 
                onChange={(e) => handleChange('label', e.target.value)} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Chiều rộng:</label>
              <input 
                type="number" 
                value={element.width} 
                onChange={(e) => handleChange('width', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Chiều cao:</label>
              <input 
                type="number" 
                value={element.height} 
                onChange={(e) => handleChange('height', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>X:</label>
              <input 
                type="number" 
                value={Math.round(element.x)} 
                onChange={(e) => handleChange('x', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Y:</label>
              <input 
                type="number" 
                value={Math.round(element.y)} 
                onChange={(e) => handleChange('y', Number(e.target.value))} 
                className="seating-designer-input"
              />
            </div>
            <div className="property-field">
              <label>Màu sắc:</label>
              <input 
                type="color" 
                value={element.color || '#3B82F6'} 
                onChange={(e) => handleChange('color', e.target.value)} 
                className="seating-designer-input"
              />
            </div>
          </>
        );
      
      default:
        return <div>Không có thuộc tính nào để hiển thị</div>;
    }
  };

  return (
    <div className="property-editor">
      <div className="property-editor-header">
        {selectedElement.type === 'stage' ? 'Sân khấu' : 
         selectedElement.type === 'section' ? 'Khu vực' : 
         selectedElement.type === 'venueObject' ? 'Vật thể' : 'Phần tử'} -  
        {element.name || element.label || 'Không có tên'}
      </div>
      <div className="property-editor-content">
        {renderFields()}
      </div>
    </div>
  );
};

export default PropertyEditor; 