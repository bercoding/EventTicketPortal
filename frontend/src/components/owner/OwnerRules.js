import React from 'react';

const OwnerRules = () => (
    <div>
        <h1 className="text-3xl font-bold text-gray-800">Quy định dành cho Nhà tổ chức sự kiện</h1>
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">1. Quy định về nội dung sự kiện</h2>
            <p className="text-gray-700 leading-relaxed">
                Nội dung sự kiện không được vi phạm pháp luật, thuần phong mỹ tục của Việt Nam. Không được chứa nội dung bạo lực, khiêu dâm, chính trị, tôn giáo nhạy cảm. Chúng tôi có quyền từ chối các sự kiện không phù hợp mà không cần báo trước.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-4">2. Quy định về vé và giá vé</h2>
            <p className="text-gray-700 leading-relaxed">
                Giá vé phải được niêm yết rõ ràng và không được thay đổi trong suốt quá trình bán vé. Chính sách hoàn trả vé phải tuân theo quy định của nền tảng (hoàn 75% giá trị nếu khách hàng yêu cầu trả trước 24 giờ). Mọi chương trình khuyến mãi phải được thông báo rõ ràng.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-4">3. Trách nhiệm của nhà tổ chức</h2>
            <p className="text-gray-700 leading-relaxed">
                Nhà tổ chức phải đảm bảo sự kiện diễn ra đúng thời gian, địa điểm và nội dung đã công bố. Chịu trách nhiệm về an toàn, an ninh trong khu vực tổ chức sự kiện. Phải cung cấp thông tin liên hệ rõ ràng để giải quyết các khiếu nại của khách hàng.
            </p>
        </div>
    </div>
);

export default OwnerRules; 