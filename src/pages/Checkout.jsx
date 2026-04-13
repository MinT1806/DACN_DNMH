import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import Footer from '../components/Footer';
import { formatPrice } from '../utils/format';

function Checkout() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shippingAddress: '',
    paymentMethod: 'cod',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-effect rounded-3xl p-12"
          >
            <h2 className="text-4xl font-serif font-bold text-luxury-white mb-4">
              Vui lòng đăng nhập
            </h2>
            <p className="text-luxury-white/60 mb-8">
              Bạn cần đăng nhập để tiến hành thanh toán
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 gold-gradient rounded-lg font-medium text-luxury-black hover:scale-105 transition-transform duration-300"
            >
              Đăng nhập
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const orderData = {
      userId: user.id,
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      shippingAddress: formData.shippingAddress,
      paymentMethod: formData.paymentMethod,
      totalAmount: getCartTotal(),
    };

    const response = await orderAPI.create(orderData);
    setLoading(false);

    if (response.status === 'success') {
      clearCart();
      navigate('/order-success', { state: { orderId: response.data?.id || response.data } });
    } else {
      setError(response.message || 'Order creation failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-serif font-bold text-luxury-white mb-12 text-center">
            Thanh toán
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="glass-effect rounded-2xl p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-luxury-white mb-6">
                    Thông tin giao hàng
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-luxury-white/80 text-sm font-medium mb-2">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={`${user.firstName || ''} ${user.lastName || ''}`}
                        disabled
                        className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white/60"
                      />
                    </div>

                    <div>
                      <label className="block text-luxury-white/80 text-sm font-medium mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white/60"
                      />
                    </div>

                    <div>
                      <label className="block text-luxury-white/80 text-sm font-medium mb-2">
                        Địa chỉ giao hàng *
                      </label>
                      <textarea
                        name="shippingAddress"
                        value={formData.shippingAddress}
                        onChange={handleChange}
                        required
                        rows="4"
                        className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white focus:outline-none focus:border-luxury-gold transition-colors"
                        placeholder="Nhập địa chỉ giao hàng đầy đủ"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-serif font-bold text-luxury-white mb-6">
                    Phương thức thanh toán
                  </h2>

                  <div className="space-y-3">
                    <label className="flex items-center p-4 glass-effect rounded-lg cursor-pointer hover:border-luxury-gold border border-transparent transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleChange}
                        className="mr-3"
                      />
                      <span className="text-luxury-white">Thanh toán khi nhận hàng (COD)</span>
                    </label>

                    <label className="flex items-center p-4 glass-effect rounded-lg cursor-pointer hover:border-luxury-gold border border-transparent transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={formData.paymentMethod === 'bank_transfer'}
                        onChange={handleChange}
                        className="mr-3"
                      />
                      <span className="text-luxury-white">Chuyển khoản ngân hàng</span>
                    </label>

                    <label className="flex items-center p-4 glass-effect rounded-lg cursor-pointer hover:border-luxury-gold border border-transparent transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="momo"
                        checked={formData.paymentMethod === 'momo'}
                        onChange={handleChange}
                        className="mr-3"
                      />
                      <span className="text-luxury-white">Đặt cọc qua Ví MoMo</span>
                    </label>

                    <label className="flex items-center p-4 glass-effect rounded-lg cursor-pointer hover:border-luxury-gold border border-transparent transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={formData.paymentMethod === 'credit_card'}
                        onChange={handleChange}
                        className="mr-3"
                      />
                      <span className="text-luxury-white">Thẻ tín dụng / Ghi nợ</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 gold-gradient rounded-lg font-medium text-luxury-black hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xử lý...' : 'Đặt hàng'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass-effect rounded-2xl p-8 sticky top-8">
                <h2 className="text-2xl font-serif font-bold text-luxury-white mb-6">
                  Tóm tắt đơn hàng
                </h2>

                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-luxury-white/80 text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-luxury-white/10 pt-4 space-y-3">
                  <div className="flex justify-between text-luxury-white/80">
                    <span>Tạm tính</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </div>
                  <div className="flex justify-between text-luxury-white/80">
                    <span>Vận chuyển</span>
                    <span>Miễn phí</span>
                  </div>
                  <div className="border-t border-luxury-white/10 pt-3">
                    <div className="flex justify-between text-2xl font-bold">
                      <span className="text-luxury-white">Tổng cộng</span>
                      <span className="text-gradient">{formatPrice(getCartTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

export default Checkout;
