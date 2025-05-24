const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Hàm tạo thông tin để vẽ ERD từ model Mongoose
function analyzeModels() {
  const modelsDir = path.join(__dirname, '../models');
  const modelsPath = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
  
  const entities = [];
  const relationships = [];
  
  // Phân tích mỗi model
  modelsPath.forEach(modelFile => {
    const modelName = modelFile.replace('.js', '');
    if (modelName === 'index') return;
    
    console.log(`Đang phân tích model ${modelName}...`);
    
    const modelPath = path.join(modelsDir, modelFile);
    const fileContent = fs.readFileSync(modelPath, 'utf-8');
    
    // Tìm schema
    const entity = {
      name: modelName,
      attributes: []
    };
    
    // Phân tích các trường
    const schemaMatch = fileContent.match(/new mongoose\.Schema\(\{([^]*?)\}\)/s);
    if (schemaMatch && schemaMatch[1]) {
      const schemaContent = schemaMatch[1];
      // Tìm các định nghĩa field trong schema
      const fieldMatches = schemaContent.matchAll(/(\w+)\s*:\s*{([^}]*)}/gs);
      
      for (const match of fieldMatches) {
        const fieldName = match[1];
        const fieldDef = match[2];
        
        let fieldType = 'unknown';
        let required = fieldDef.includes('required') ? '✓' : '';
        
        // Xác định kiểu dữ liệu
        if (fieldDef.includes('String')) {
          fieldType = 'String';
        } else if (fieldDef.includes('Number')) {
          fieldType = 'Number';
        } else if (fieldDef.includes('Date')) {
          fieldType = 'Date';
        } else if (fieldDef.includes('Boolean')) {
          fieldType = 'Boolean';
        } else if (fieldDef.includes('ObjectId')) {
          fieldType = 'ObjectId';
          // Tìm ref để xác định mối quan hệ
          const refMatch = fieldDef.match(/ref:\s*['"](\w+)['"]/);
          if (refMatch) {
            relationships.push({
              from: modelName,
              to: refMatch[1],
              type: 'N:1', // Giả định N:1 mặc định
              field: fieldName
            });
            fieldType = `ObjectId (Ref: ${refMatch[1]})`;
          }
        } else if (fieldDef.includes('[')) {
          fieldType = 'Array';
          // Kiểm tra nếu là mảng ObjectId -> Quan hệ N:N
          const refMatch = fieldDef.match(/type:\s*.*ObjectId.*ref:\s*['"](\w+)['"]/s);
          if (refMatch) {
            relationships.push({
              from: modelName,
              to: refMatch[1],
              type: 'N:N',
              field: fieldName
            });
            fieldType = `Array<ObjectId> (Ref: ${refMatch[1]})`;
          }
        }
        
        entity.attributes.push({
          name: fieldName,
          type: fieldType,
          required: required
        });
      }
    }
    
    entities.push(entity);
  });
  
  // Sắp xếp mối quan hệ
  relationships.forEach(rel => {
    // Xác định kiểu quan hệ chính xác hơn
    const fromEntity = entities.find(e => e.name === rel.from);
    const toEntity = entities.find(e => e.name === rel.to);
    
    if (fromEntity && toEntity) {
      // Kiểm tra có mối quan hệ ngược không
      const reverseRel = relationships.find(r => 
        r.from === rel.to && r.to === rel.from
      );
      
      if (reverseRel) {
        if (rel.type === 'N:N' && reverseRel.type === 'N:N') {
          rel.type = 'N:N (Bidirectional)';
        } else if (rel.type === 'N:1' && reverseRel.type === 'N:1') {
          rel.type = '1:1';
        }
      }
    }
  });
  
  return { entities, relationships };
}

// Tạo hướng dẫn Draw.io
function generateDrawIOInstructions(analysisResult) {
  const { entities, relationships } = analysisResult;
  
  let instructions = `# Hướng dẫn vẽ ERD trên Draw.io

## Entities
`;

  entities.forEach(entity => {
    instructions += `
### ${entity.name}
| Trường | Kiểu | Bắt buộc |
|--------|------|----------|
`;
    
    entity.attributes.forEach(attr => {
      instructions += `| ${attr.name} | ${attr.type} | ${attr.required} |\n`;
    });
    
    instructions += '\n';
  });
  
  instructions += `
## Relationships
| Entity 1 | Relationship | Entity 2 | Thông qua trường |
|----------|--------------|----------|------------------|
`;
  
  relationships.forEach(rel => {
    instructions += `| ${rel.from} | ${rel.type} | ${rel.to} | ${rel.field} |\n`;
  });
  
  instructions += `

## Hướng dẫn vẽ trên Draw.io
1. Truy cập [Draw.io](https://app.diagrams.net/)
2. Chọn "Create New Diagram" > "Entity Relationship"
3. Tạo các entity box cho từng entity được liệt kê ở trên
4. Thêm các thuộc tính cho mỗi entity
5. Vẽ các mối quan hệ dựa trên bảng "Relationships"
   - Sử dụng đường nối thích hợp:
     - 1:1 (1--1)
     - 1:N (1--*)
     - N:M (*--*)
6. Điều chỉnh sơ đồ cho dễ đọc`;

  return instructions;
}

// Thực thi
try {
  console.log('Đang phân tích các model Mongoose...');
  const analysisResult = analyzeModels();
  
  console.log('Đang tạo hướng dẫn vẽ ERD trên Draw.io...');
  const instructions = generateDrawIOInstructions(analysisResult);
  
  // Lưu kết quả ra file
  const outputPath = path.join(__dirname, '../erd-instructions.md');
  fs.writeFileSync(outputPath, instructions);
  
  console.log(`Đã tạo hướng dẫn vẽ ERD tại: ${outputPath}`);
  console.log('Dùng file này làm tài liệu tham khảo để vẽ ERD trên Draw.io');
  
  // In thêm JSON để hỗ trợ tự động hóa (nếu cần)
  const jsonOutputPath = path.join(__dirname, '../erd-data.json');
  fs.writeFileSync(jsonOutputPath, JSON.stringify(analysisResult, null, 2));
  
  console.log(`Dữ liệu JSON để tích hợp: ${jsonOutputPath}`);
} catch (error) {
  console.error('Lỗi khi tạo hướng dẫn ERD:', error);
}
