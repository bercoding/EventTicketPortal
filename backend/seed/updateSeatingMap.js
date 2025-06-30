import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Cấu hình ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

import Event from '../models/Event.js';
import TicketType from '../models/TicketType.js';

// --- ID SỰ KIỆN CẦN CẬP NHẬT ---
const EVENT_ID_TO_UPDATE = '684fbe158f87b4156adc77ae'; // ID sự kiện bạn đang làm việc

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const generateSeatingMap = (ticketTiers) => {
    const sections = [];
    const seatsPerSection = 20;
    const rowsPerSection = 4;
    const seatsPerRow = 5;
    const seatSpacing = 20;
    const rowSpacing = 20;
    const sectionSpacing = 30; // Khoảng cách giữa các khu vực

    const totalSections = 6;
    const sectionsPerRow = 3; 

    // Tính toán vị trí bắt đầu để căn giữa
    const totalBlockWidth = (sectionsPerRow * (seatsPerRow * seatSpacing)) + ((sectionsPerRow - 1) * sectionSpacing);
    const startX = 400 - (totalBlockWidth / 2); // Căn giữa với sân khấu (rộng 300, tâm 400)
    const startY = 150; // Vị trí Y bắt đầu bên dưới sân khấu

    for (let i = 0; i < totalSections; i++) {
        const sectionRowIndex = Math.floor(i / sectionsPerRow);
        const sectionColIndex = i % sectionsPerRow;

        const sectionX = startX + sectionColIndex * (seatsPerRow * seatSpacing + sectionSpacing);
        const sectionY = startY + sectionRowIndex * (rowsPerSection * rowSpacing + rowSpacing + 20);

        const sectionName = String.fromCharCode(65 + i); // A, B, C, D, E, F
        
        // Gán loại vé cho từng khu vực một cách tuần tự
        const ticketTier = ticketTiers[i % ticketTiers.length]._id;

        const section = {
            name: sectionName,
            ticketTier: ticketTier,
            rows: [],
            labelPosition: { x: sectionX + ((seatsPerRow-1) * seatSpacing) / 2, y: sectionY - 15 }
        };

        for (let j = 0; j < rowsPerSection; j++) {
            const row = {
                name: `${sectionName}${j + 1}`,
                seats: [],
            };
            for (let k = 0; k < seatsPerRow; k++) {
                row.seats.push({
                    number: `${row.name}-${k + 1}`,
                    status: 'available',
                    x: sectionX + k * seatSpacing,
                    y: sectionY + j * rowSpacing,
                });
            }
            section.rows.push(row);
        }
        sections.push(section);
    }
    
    return { layoutType: 'theater', sections };
};


const updateEvent = async () => {
    await connectDB();
    try {
        const event = await Event.findById(EVENT_ID_TO_UPDATE);
        if (!event) {
            console.log('Không tìm thấy sự kiện với ID đã cho.');
            return;
        }

        const ticketTypes = await TicketType.find({ event: event._id });
        if (ticketTypes.length === 0) {
            console.log("Sự kiện này chưa có loại vé nào. Vui lòng tạo loại vé trước.");
            return;
        }

        console.log('Đang tạo sơ đồ ghế mới...');
        const newSeatingMap = generateSeatingMap(ticketTypes);
        
        event.seatingMap = newSeatingMap;
        await event.save();

        console.log(`Cập nhật thành công sơ đồ ghế cho sự kiện: "${event.title}"`);

    } catch (error) {
        console.error('Lỗi khi cập nhật sự kiện:', error);
    } finally {
        mongoose.connection.close();
    }
};

updateEvent(); 