import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTheaterMasks,
  faUsers,
  faChair,
  faArrowRight,
  faMusic,
  faFootballBall,
  faFilm,
  faHandshake,
  faChalkboardTeacher,
  faMicrophone,
  faCalendarAlt,
  faGlobe,
  faLaptop,
  faTree,
  faMapMarkedAlt,
  faVideo,
  faBroadcastTower
} from '@fortawesome/free-solid-svg-icons';
import './CreateEvent.css';

const EVENT_TEMPLATES = [
  {
    id: 'seating',
    title: 'Sự kiện có ghế ngồi cố định',
    description: 'Sự kiện trong nhà với ghế ngồi được sắp xếp theo sơ đồ cố định, khách hàng chọn ghế cụ thể',
    icon: faChair,
    color: 'from-blue-600 to-purple-600',
    features: [
      'Sơ đồ ghế ngồi chi tiết',
      'Khách chọn ghế cụ thể khi mua vé',
      'Phân chia khu vực VIP/thường rõ ràng',
      'Quản lý chỗ ngồi chính xác 100%'
    ],
    examples: [
      { icon: faMusic, text: 'Concert trong nhà' },
      { icon: faTheaterMasks, text: 'Diễn kịch, nhà hát' },
      { icon: faFilm, text: 'Rạp chiếu phim' },
      { icon: faFootballBall, text: 'Sân vận động có ghế' }
    ],
    route: '/create-event-with-seating',
    locationTypes: ['offline'],
    hasSeatingMap: true,
    ticketSelectionType: 'specific_seat'
  },
  {
    id: 'general',
    title: 'Sự kiện tham gia tự do',
    description: 'Sự kiện ngoài trời hoặc không gian mở, khách tự do di chuyển, chỉ cần mua vé theo khu vực',
    icon: faUsers,
    color: 'from-green-600 to-teal-600',
    features: [
      'Không ghế ngồi cố định',
      'Phân khu vực linh hoạt (VIP, General)',
      'Khách tự do di chuyển trong khu vực',
      'Quản lý theo số lượng người/khu vực'
    ],
    examples: [
      { icon: faTree, text: 'Festival ngoài trời' },
      { icon: faHandshake, text: 'Hội thảo, networking' },
      { icon: faChalkboardTeacher, text: 'Workshop, đào tạo' },
      { icon: faCalendarAlt, text: 'Triển lãm, hội chợ' }
    ],
    route: '/create-event',
    locationTypes: ['offline'],
    hasSeatingMap: false,
    ticketSelectionType: 'zone_based'
  },
  {
    id: 'online',
    title: 'Sự kiện trực tuyến',
    description: 'Sự kiện hoàn toàn online qua video call, livestream, không cần địa điểm vật lý',
    icon: faGlobe,
    color: 'from-orange-600 to-red-600',
    features: [
      'Hoàn toàn trực tuyến',
      'Link tham gia qua email',
      'Streaming/Video conference',
      'Không giới hạn địa lý'
    ],
    examples: [
      { icon: faLaptop, text: 'Webinar, khóa học online' },
      { icon: faVideo, text: 'Hội nghị trực tuyến' },
      { icon: faBroadcastTower, text: 'Livestream show' },
      { icon: faMicrophone, text: 'Podcast live' }
    ],
    route: '/create-event',
    locationTypes: ['online'],
    hasSeatingMap: false,
    ticketSelectionType: 'registration_only'
  }
];

const EventTemplateSelection = () => {
  const navigate = useNavigate();

  const handleTemplateSelect = (template) => {
    navigate(template.route, { 
      state: { 
        templateType: template.id,
        templateName: template.title 
      }
    });
  };

  return (
    <div className="create-event-container">
      <div className="create-event-header">
        <h2>Tạo Sự Kiện Mới</h2>
        <p>Chọn loại sự kiện phù hợp với nhu cầu của bạn để được hỗ trợ tối ưu</p>
      </div>

      <div className="create-event-form">
        <div className="form-section">
          <h3>🎯 Chọn Loại Sự Kiện</h3>
          <p>Mỗi loại sự kiện có những tính năng và cách quản lý khác nhau</p>
          
          <div className="template-selection-grid">
            {EVENT_TEMPLATES.map((template) => (
              <div 
                key={template.id}
                className="template-card"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className={`template-header bg-gradient-to-r ${template.color}`}>
                  <FontAwesomeIcon icon={template.icon} className="template-icon" />
                  <h4>{template.title}</h4>
                </div>
                
                <div className="template-body">
                  <p className="template-description">{template.description}</p>
                  
                  <div className="template-features">
                    <h5>✨ Tính năng chính:</h5>
                    <ul>
                      {template.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="template-examples">
                    <h5>📋 Ví dụ sự kiện:</h5>
                    <div className="example-grid">
                      {template.examples.map((example, index) => (
                        <div key={index} className="example-item">
                          <FontAwesomeIcon icon={example.icon} />
                          <span>{example.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button className="select-template-btn">
                    Chọn loại này
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventTemplateSelection; 