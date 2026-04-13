import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/api';
import { formatPrice, getStatusLabel, getStatusColor, formatDate } from '../utils/format';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = location.state?.orderId;

    if (!orderId) {
      // If no order ID, redirect to home
      navigate('/');
      return;
    }

    // Fetch order details
    const fetchOrderDetails = async () => {
      try {
        const response = await orderAPI.getById(orderId);
        if (response.status === 'success') {
          setOrderDetails(response.data);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="text-luxury-gold text-xl">Đang tải thông tin đơn hàng...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-luxury-gray/50 backdrop-blur-lg rounded-lg p-8 border border-luxury-gold/20"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
          >
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>

          {/* Success Message */}
          <h1 className="text-3xl font-playfair text-luxury-gold text-center mb-4">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-300 text-center mb-8">
            Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xác nhận.
          </p>

          {/* Order Details */}
          {orderDetails && (
            <div className="space-y-6">
              <div className="border-t border-b border-luxury-gold/20 py-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Mã đơn hàng</p>
                    <p className="text-luxury-gold font-semibold">#{orderDetails.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Ngày đặt</p>
                    <p className="text-white">{formatDate(orderDetails.orderDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Tổng tiền</p>
                    <p className="text-luxury-gold font-semibold text-lg">
                      {formatPrice(orderDetails.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Trạng thái</p>
                    <p className={`font-semibold ${getStatusColor(orderDetails.status)}`}>
                      {getStatusLabel(orderDetails.status)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div>
                <h3 className="text-luxury-gold font-semibold mb-3">Địa chỉ giao hàng</h3>
                <div className="bg-luxury-black/50 p-4 rounded-lg">
                  <p className="text-white">{orderDetails.shippingAddress}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-luxury-gold font-semibold mb-3">Sản phẩm</h3>
                <div className="space-y-3">
                  {orderDetails.items && orderDetails.items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-luxury-black/50 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="text-white font-semibold">{item.product?.name || 'Product'}</p>
                        <p className="text-gray-400 text-sm">Số lượng: {item.quantity}</p>
                      </div>
                      <p className="text-luxury-gold font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              {orderDetails.paymentMethod && (
                <div>
                  <h3 className="text-luxury-gold font-semibold mb-3">Phương thức thanh toán</h3>
                  <div className="bg-luxury-black/50 p-4 rounded-lg">
                    <p className="text-white capitalize">{orderDetails.paymentMethod}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-3 bg-luxury-gold text-luxury-black font-semibold rounded-lg hover:bg-luxury-gold-light transition-colors"
            >
              Xem tất cả đơn hàng
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-luxury-gray text-white font-semibold rounded-lg hover:bg-luxury-gray/80 transition-colors border border-luxury-gold/20"
            >
              Tiếp tục mua sắm
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>Email xác nhận đã được gửi đến địa chỉ email của bạn.</p>
            <p className="mt-2">Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ khách hàng.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderSuccess;
