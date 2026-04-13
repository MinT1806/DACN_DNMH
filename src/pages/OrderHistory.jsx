import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI, authAPI } from '../services/api';
import { formatPrice, getStatusLabel, getStatusColor, formatDate } from '../utils/format';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (!user || !user.id) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await orderAPI.getUserOrders(user.id);
        if (response.status === 'success') {
          setOrders(response.data || []);
        } else {
          setError('Không thể tải đơn hàng');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Đã xảy ra lỗi khi tải đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);



  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="text-luxury-gold text-xl">Đang tải đơn hàng...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-playfair text-luxury-gold mb-8">Lịch sử đơn hàng</h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-luxury-gray/50 backdrop-blur-lg rounded-lg p-12 border border-luxury-gold/20 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3 className="text-xl text-gray-400 mb-4">Chưa có đơn hàng nào</h3>
              <p className="text-gray-500 mb-6">Bắt đầu mua sắm để tạo đơn hàng đầu tiên</p>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-3 bg-luxury-gold text-luxury-black font-semibold rounded-lg hover:bg-luxury-gold-light transition-colors"
              >
                Khám phá sản phẩm
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-luxury-gray/50 backdrop-blur-lg rounded-lg p-6 border border-luxury-gold/20 hover:border-luxury-gold/40 transition-all cursor-pointer"
                  onClick={() => navigate('/order-success', { state: { orderId: order.id } })}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-luxury-gold font-semibold text-lg mb-1">
                        Order #{order.id}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {formatDate(order.orderDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </p>
                      <p className="text-luxury-gold font-bold text-xl mt-1">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="border-t border-luxury-gold/20 pt-4">
                      <p className="text-gray-400 text-sm mb-2">
                        {order.items.length} sản phẩm
                      </p>
                      <div className="space-y-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-300">
                              {item.product?.name || 'Product'} x {item.quantity}
                            </span>
                            <span className="text-gray-400">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-gray-500 text-sm">
                            +{order.items.length - 3} sản phẩm khác
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div className="mt-4 pt-4 border-t border-luxury-gold/20">
                      <p className="text-gray-400 text-sm mb-1">Giao đến:</p>
                      <p className="text-gray-300 text-sm">{order.shippingAddress}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OrderHistory;
