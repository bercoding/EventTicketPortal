import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../../services/api';
import { toast } from 'react-toastify';
import QrReader from 'react-qr-scanner';

const TicketScanner = ({ eventId }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    used: 0,
    unused: 0,
    cancelled: 0,
    returned: 0,
    checkInsByHour: []
  });
  const [loading, setLoading] = useState(false);
  const [delayBetweenScans, setDelayBetweenScans] = useState(1000);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [manualQrCode, setManualQrCode] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchTicketStats();
    }
  }, [eventId]);

  const fetchTicketStats = async () => {
    setLoading(true);
    try {
      console.log('Đang lấy thống kê vé cho sự kiện:', eventId);
      const response = await ticketAPI.getTicketStats(eventId);
      
      if (response && response.success) {
        console.log('Nhận được thống kê vé:', response.stats);
        setStats(response.stats);
        toast.success('Đã cập nhật thống kê vé');
      } else {
        console.error('Không thể lấy thống kê vé:', response);
        toast.warning('Không thể lấy thống kê từ database, vui lòng kiểm tra kết nối.');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê vé:', error);
      toast.error('Không thể kết nối với database, vui lòng kiểm tra kết nối mạng và máy chủ')
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (data) => {
    if (data && !loading) {
      setScanning(false);
      console.log('QR code quét được:', data);
      
      // Log chi tiết hơn về dữ liệu QR code
      if (typeof data === 'string') {
        console.log('QR code (string):', data);
      } else if (data && data.text) {
        console.log('QR code (object):', data.text);
      } else {
        console.log('QR code format không xác định:', JSON.stringify(data));
      }
      
      await verifyTicket(data);
    }
  };

  const handleError = (err) => {
    console.error('Lỗi quét QR:', err);
    toast.error('Không thể quét mã QR');
  };

  const verifyTicket = async (qrData) => {
    setLoading(true);

    try {
      // Đảm bảo qrData là một chuỗi
      const qrCode = typeof qrData === 'string' ? qrData : qrData?.text || '';
      
      console.log('Đang xác thực mã QR:', qrCode, 'cho sự kiện:', eventId);
      console.log('Chi tiết mã QR:', JSON.stringify(qrData));

      let result;
      
      try {
        // Sử dụng API để xác thực vé
        console.log('Đang xác thực vé từ database với mã QR:', qrCode);
        const response = await ticketAPI.verifyTicket(qrCode, eventId);
        
        result = response;
        console.log('Kết quả xác thực vé từ database:', result);
        
        // Nếu thành công, cập nhật lại thống kê
        if (result.success) {
          fetchTicketStats();
        }
      } catch (apiError) {
        console.error('Lỗi khi xác thực vé với database:', apiError);
        toast.error('Không thể xác thực vé: ' + (apiError.message || 'Lỗi kết nối đến database'));
        
        result = {
          success: false,
          message: 'Không thể xác thực vé với hệ thống. Vui lòng thử lại.'
        };
      }

      console.log('Kết quả xác thực vé:', result);
      setScanResult(result);

      // Thêm kết quả quét vào lịch sử
      const currentScan = {
        time: new Date(),
        result: result,
        success: result.success
      };
      
      setScanHistory(prev => [currentScan, ...prev].slice(0, 20)); // Giữ tối đa 20 kết quả quét gần nhất

      if (result.success) {
        toast.success('Vé hợp lệ');
      } else {
        toast.error(result.message || 'Vé không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi xác thực vé:', error);
      setScanResult({ 
        success: false, 
        message: 'Có lỗi xảy ra khi xác thực vé' 
      });
      toast.error('Không thể xác thực vé');
    } finally {
      setLoading(false);
    }
  };

  const toggleScanner = () => {
    if (scanning) {
      setScanning(false);
    } else {
      setScanResult(null);
      setScanning(true);
    }
  };

  const testManualQrScan = async () => {
    if (!manualQrCode) {
      toast.warning('Vui lòng nhập mã QR của vé để kiểm tra');
      return;
    }
    console.log('Đang xác thực mã QR:', manualQrCode);
    await verifyTicket(manualQrCode);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Không xác định';
    }
  };

  // Tính tỷ lệ sử dụng vé (phần trăm)
  const usageRatePercent = stats.total > 0 
    ? Math.round((stats.used / stats.total) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-wrap -mx-4">
        {/* Thống kê vé */}
        <div className="w-full lg:w-1/3 px-4 mb-6">
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Thống kê vé</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Tổng vé</div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Đã check-in</div>
                <div className="text-2xl font-bold text-green-600">{stats.used}</div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Chưa check-in</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.unused}</div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Đã hủy/trả lại</div>
                <div className="text-2xl font-bold text-red-600">{stats.cancelled + stats.returned}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-1">Tỷ lệ check-in: {usageRatePercent}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${usageRatePercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={toggleScanner}
              className={`w-full py-2 px-4 rounded font-medium ${scanning 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'}`}
              disabled={loading}
            >
              {scanning ? 'Dừng quét' : 'Bắt đầu quét'}
            </button>
          </div>



          {/* Vùng nhập mã QR thủ công */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Nhập mã QR vé để kiểm tra</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 border rounded px-3 py-2 text-sm"
                value={manualQrCode}
                onChange={(e) => setManualQrCode(e.target.value)}
                placeholder="Nhập mã QR vé..."
              />
              <button
                onClick={testManualQrScan}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
              >
                Xác thực
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Nhập chính xác mã QR từ vé để xác thực
            </p>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mt-4 w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded font-medium"
          >
            {showHistory ? 'Ẩn lịch sử quét' : 'Xem lịch sử quét'}
          </button>

          {showHistory && scanHistory.length > 0 && (
            <div className="mt-4 bg-gray-50 p-3 rounded-lg max-h-60 overflow-y-auto">
              <h4 className="text-lg font-medium mb-2">Lịch sử quét</h4>
              {scanHistory.map((scan, index) => (
                <div 
                  key={index} 
                  className={`mb-2 p-2 rounded text-sm ${scan.success ? 'bg-green-100' : 'bg-red-100'}`}
                >
                  <div className="font-medium">
                    {new Date(scan.time).toLocaleTimeString()}
                  </div>
                  <div>
                    {scan.result.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Máy quét QR */}
        <div className="w-full lg:w-2/3 px-4">
          <div className="mb-4">
            {scanning ? (
              <div className="p-4 border-2 border-gray-300 rounded-lg">
                <div className="mb-2 text-center">Đang quét mã QR...</div>
                <QrReader
                  delay={delayBetweenScans}
                  style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}
                  onError={handleError}
                  onScan={handleScan}
                  facingMode="user"
                />
                <div className="text-center mt-2 text-sm text-gray-500">
                  Vui lòng đưa mã QR vào khung quét
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">
                    {loading ? 'Đang xử lý...' : 'Nhấn "Bắt đầu quét" để quét mã QR'}
                  </div>
                  {loading && (
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Kết quả quét */}
          {scanResult && (
            <div className={`p-4 rounded-lg mb-4 ${
              scanResult.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
            }`}>
              <h3 className={`text-lg font-bold mb-2 ${
                scanResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {scanResult.success ? '✅ Vé hợp lệ' : '❌ Vé không hợp lệ'}
              </h3>
              <p className="mb-2">{scanResult.message}</p>
              
              {scanResult.success && scanResult.ticket && (
                <div className="bg-white rounded p-3 mt-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-semibold">Sự kiện:</div>
                    <div>{scanResult.ticket.event.title}</div>
                    
                    <div className="font-semibold">Ngày:</div>
                    <div>{formatDate(scanResult.ticket.event.date)}</div>
                    
                    <div className="font-semibold">Tên khách hàng:</div>
                    <div>{scanResult.ticket.user?.name || 'Không có thông tin'}</div>
                    
                    <div className="font-semibold">Email:</div>
                    <div>{scanResult.ticket.user?.email || 'Không có thông tin'}</div>
                    
                    {scanResult.ticket.seat && (
                      <>
                        <div className="font-semibold">Khu:</div>
                        <div>{scanResult.ticket.seat.section || 'N/A'}</div>
                        
                        <div className="font-semibold">Hàng:</div>
                        <div>{scanResult.ticket.seat.row || 'N/A'}</div>
                        
                        <div className="font-semibold">Ghế:</div>
                        <div>{scanResult.ticket.seat.number || 'N/A'}</div>
                      </>
                    )}
                    
                    <div className="font-semibold">Loại vé:</div>
                    <div>{scanResult.ticket.ticketType || 'Tiêu chuẩn'}</div>
                    
                    <div className="font-semibold">Giá vé:</div>
                    <div>{scanResult.ticket.price ? `${scanResult.ticket.price.toLocaleString()} VNĐ` : 'N/A'}</div>
                  </div>
                </div>
              )}
              
              {!scanResult.success && scanResult.ticket && (
                <div className="bg-white rounded p-3 mt-2">
                  <div className="text-sm">
                    <div className="font-semibold">Lý do:</div>
                    <div>{scanResult.message}</div>
                    
                    {scanResult.usedAt && (
                      <div className="mt-1">
                        <span className="font-semibold">Đã sử dụng lúc:</span> {formatDate(scanResult.usedAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketScanner; 