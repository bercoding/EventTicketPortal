const ContentSection = require('../models/ContentSection');
const Event = require('../models/Event');

// Lấy tất cả content sections
exports.getAllSections = async (req, res) => {
    try {
        const sections = await ContentSection.find({ isActive: true })
            .populate('events')
            .sort('order');
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sections', error: error.message });
    }
};

// Lấy một section cụ thể
exports.getSection = async (req, res) => {
    try {
        const section = await ContentSection.findOne({ 
            name: req.params.name,
            isActive: true 
        }).populate('events');
        
        if (!section) {
            return res.status(404).json({ message: 'Không tìm thấy section' });
        }
        
        res.json(section);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy section', error: error.message });
    }
};

// Cập nhật section (Admin only)
exports.updateSection = async (req, res) => {
    try {
        const { events, order, isActive } = req.body;
        
        const section = await ContentSection.findOne({ name: req.params.name });
        if (!section) {
            return res.status(404).json({ message: 'Không tìm thấy section' });
        }

        // Validate events exist
        if (events) {
            const eventIds = events.map(id => id.toString());
            const existingEvents = await Event.find({ _id: { $in: eventIds } });
            if (existingEvents.length !== eventIds.length) {
                return res.status(400).json({ message: 'Một số sự kiện không tồn tại' });
            }
            section.events = events;
        }

        if (typeof order !== 'undefined') section.order = order;
        if (typeof isActive !== 'undefined') section.isActive = isActive;

        section.lastUpdatedBy = req.user._id;
        section.lastUpdatedAt = new Date();

        await section.save();
        
        res.json(section);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật section', error: error.message });
    }
};

// Khởi tạo các sections mặc định (Admin only)
exports.initializeSections = async (req, res) => {
    try {
        const defaultSections = [
            {
                name: 'special_events',
                displayName: 'Sự kiện đặc biệt',
                description: 'Các sự kiện đặc biệt và nổi bật',
                order: 1
            },
            {
                name: 'trending_events',
                displayName: 'Sự kiện xu hướng',
                description: 'Các sự kiện đang được quan tâm nhiều nhất',
                order: 2
            },
            {
                name: 'recommended_events',
                displayName: 'Dành cho bạn',
                description: 'Các sự kiện được đề xuất dựa trên sở thích của bạn',
                order: 3
            },
            {
                name: 'this_week',
                displayName: 'Tuần này',
                description: 'Các sự kiện diễn ra trong tuần này',
                order: 4
            },
            {
                name: 'this_month',
                displayName: 'Tháng này',
                description: 'Các sự kiện sắp diễn ra trong tháng',
                order: 5
            }
        ];

        for (const section of defaultSections) {
            await ContentSection.findOneAndUpdate(
                { name: section.name },
                section,
                { upsert: true, new: true }
            );
        }

        res.json({ message: 'Khởi tạo sections thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi khởi tạo sections', error: error.message });
    }
}; 