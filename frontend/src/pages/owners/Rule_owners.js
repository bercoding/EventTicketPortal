import React from 'react';
import { FaBan, FaAd, FaShieldAlt, FaUserShield } from 'react-icons/fa'; // Import icons từ react-icons

const EventOwnershipRules = () => {
  const sections = [
    {
      title: "Danh mục hàng hóa, dịch vụ cấm kinh doanh",
      icon: <FaBan className="text-red-500 text-3xl" />,
      rules: [
        "Cấm kinh doanh các sản phẩm, dịch vụ có ảnh hưởng tiêu cực đến sức khỏe cộng đồng.",
        "Cấm bán các mặt hàng không có nguồn gốc xuất xứ rõ ràng.",
        "Cấm kinh doanh các sản phẩm, dịch vụ gây ảnh hưởng đến môi trường hoặc động vật hoang dã.",
        "Cấm bán các sản phẩm không an toàn cho người sử dụng.",
        "Cấm các dịch vụ không có chứng nhận hợp pháp từ cơ quan chức năng.",
        "Cấm các loại hình dịch vụ gây hại cho trẻ em hoặc người khuyết tật."
      ],
    },
    {
      title: "Danh mục hàng hóa, dịch vụ cấm quảng cáo",
      icon: <FaAd className="text-yellow-500 text-3xl" />,
      rules: [
        "Cấm quảng cáo các sản phẩm gây nghiện hoặc ảnh hưởng đến sức khỏe tâm thần.",
        "Cấm quảng cáo các dịch vụ lừa đảo, gây hoang mang cho người tiêu dùng.",
        "Cấm quảng cáo các sản phẩm, dịch vụ vi phạm bản quyền hoặc có tính chất lừa gạt.",
        "Cấm quảng cáo các sản phẩm, dịch vụ không an toàn cho người tiêu dùng.",
        "Cấm quảng cáo những dịch vụ không rõ ràng, không minh bạch về giá trị."
      ],
    },
    {
      title: "Quy định kiểm duyệt nội dung và hình ảnh",
      icon: <FaShieldAlt className="text-blue-500 text-3xl" />,
      rules: [
        "Nội dung phải phù hợp với thuần phong mỹ tục và không chứa yếu tố gây tranh cãi.",
        "Hình ảnh và video phải rõ ràng, không vi phạm quyền riêng tư của người khác.",
        "Kiểm duyệt nội dung phải đảm bảo tính khách quan và chính xác, không đưa tin giả.",
        "Quy định về việc không để hình ảnh bạo lực, đồi trụy hoặc xúc phạm đến nhân phẩm con người.",
        "Các nội dung phải có sự đồng ý từ tất cả các bên liên quan trước khi đăng tải."
      ],
    },
    {
      title: "Quy định về bảo vệ quyền lợi người tham gia",
      icon: <FaUserShield className="text-green-500 text-3xl" />,
      rules: [
        "Cấm thu thập thông tin cá nhân của người tham gia mà không có sự đồng ý rõ ràng.",
        "Cấm việc chia sẻ thông tin cá nhân của người tham gia mà không có sự đồng ý.",
        "Các sự kiện phải cung cấp bảo hiểm đầy đủ cho người tham gia trong các trường hợp khẩn cấp.",
        "Các nhà tổ chức sự kiện cần phải có đội ngũ y tế và nhân viên hỗ trợ khẩn cấp sẵn sàng."
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-teal-50 to-purple-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
          {/* Nền trang trí */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-teal-500/10 rounded-3xl"></div>
          
          {/* Tiêu đề chính */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-12 tracking-tight relative z-10">
            Các Luật Cần Thực Hiện Đối Với Nhà Sở Hữu Sự Kiện
            <div className="mt-2 h-1 bg-gradient-to-r from-indigo-500 to-teal-500 w-32 mx-auto rounded-full"></div>
          </h1>

          {/* Nội dung các section */}
          {sections.map((section, index) => (
            <div
              key={index}
              className="mb-12 animate__animated animate__fadeInUp"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="flex items-center mb-6">
                {section.icon}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 ml-4">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-4">
                {section.rules.map((rule, ruleIndex) => (
                  <li
                    key={ruleIndex}
                    className="flex items-start text-base md:text-lg text-gray-700 bg-gray-50/50 rounded-xl p-5 transition-all duration-300 hover:bg-indigo-100 hover:text-indigo-900 hover:shadow-lg group"
                  >
                    <span className="inline-block w-2.5 h-2.5 bg-indigo-500 rounded-full mt-2 mr-3 group-hover:bg-indigo-700 transition-colors"></span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Nút hành động */}
          <div className="mt-12 text-center">
            <a
              href="#"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-teal-600 text-white font-semibold rounded-full shadow-xl hover:from-indigo-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
            >
              Tìm hiểu thêm
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Footer nhỏ */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          © 2025 Quy định sự kiện. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default EventOwnershipRules;