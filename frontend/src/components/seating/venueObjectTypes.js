// Các loại vật thể có thể thêm vào sơ đồ
const venueObjectTypes = [
  {
    id: 'entrance',
    name: 'Lối vào',
    icon: 'FaDoorOpen',
    color: '#22C55E',
    width: 60,
    height: 30
  },
  {
    id: 'exit',
    name: 'Lối ra',
    icon: 'FaDoorClosed',
    color: '#EF4444',
    width: 60,
    height: 30
  },
  {
    id: 'restroom',
    name: 'WC',
    icon: 'FaToilet',
    color: '#0EA5E9',
    width: 40,
    height: 40
  },
  {
    id: 'food',
    name: 'Đồ ăn',
    icon: 'FaHamburger',
    color: '#F59E0B',
    width: 40,
    height: 40
  },
  {
    id: 'table',
    name: 'Bàn',
    icon: 'FaTable',
    color: '#6366F1',
    width: 50,
    height: 50,
    isRound: true
  },
  {
    id: 'chair',
    name: 'Ghế',
    icon: 'FaChair',
    color: '#8B5CF6',
    width: 30,
    height: 30
  },
  {
    id: 'camera',
    name: 'Máy quay',
    icon: 'FaVideo',
    color: '#EC4899',
    width: 35,
    height: 35
  },
  {
    id: 'speaker',
    name: 'Loa',
    icon: 'FaVolumeUp',
    color: '#10B981',
    width: 30,
    height: 40
  },
  {
    id: 'microphone',
    name: 'Micro',
    icon: 'FaMicrophone',
    color: '#3B82F6',
    width: 25,
    height: 40
  },
  {
    id: 'lights',
    name: 'Đèn',
    icon: 'FaLightbulb',
    color: '#FBBF24',
    width: 35,
    height: 35
  },
  {
    id: 'plant',
    name: 'Cây cảnh',
    icon: 'FaSeedling',
    color: '#34D399',
    width: 35,
    height: 35
  },
  {
    id: 'custom',
    name: 'Tuỳ chỉnh',
    icon: 'FaSquare',
    color: '#8B5CF6',
    width: 50,
    height: 50
  }
];

export default venueObjectTypes; 