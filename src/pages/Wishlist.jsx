import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { wishlistAPI, authAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

const Wishlist = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (!user || !user.id) {
      navigate('/login');
      return;
    }

    const fetchWishlist = async () => {
      try {
        const response = await wishlistAPI.getAll(user.id);
        if (response.status === 'success') {
          setWishlistItems(response.data || []);
        } else {
          setError('Failed to fetch wishlist');
        }
      } catch (err) {
        console.error('Error fetching wishlist:', err);
        setError('An error occurred while fetching wishlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate]);

  const handleRemoveFromWishlist = async (wishlistId) => {
    try {
      const response = await wishlistAPI.remove(wishlistId);
      if (response.status === 'success') {
        setWishlistItems((prev) => prev.filter((item) => item.id !== wishlistId));
      } else {
        alert('Failed to remove item from wishlist');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      alert('An error occurred while removing item');
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const handleMoveToCart = async (wishlistId, product) => {
    handleAddToCart(product);
    await handleRemoveFromWishlist(wishlistId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="text-luxury-gold text-xl">Đang tải danh sách yêu thích...</div>
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
          <h1 className="text-4xl font-playfair text-luxury-gold mb-8">Danh sách yêu thích</h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {wishlistItems.length === 0 ? (
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <h3 className="text-xl text-gray-400 mb-4">Danh sách yêu thích trống</h3>
              <p className="text-gray-500 mb-6">Lưu những sản phẩm bạn yêu thích</p>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-3 bg-luxury-gold text-luxury-black font-semibold rounded-lg hover:bg-luxury-gold-light transition-colors"
              >
                Khám phá sản phẩm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item, index) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-luxury-gray/50 backdrop-blur-lg rounded-lg overflow-hidden border border-luxury-gold/20 hover:border-luxury-gold/40 transition-all group"
                  >
                    {/* Product Image */}
                    <div
                      className="relative h-64 bg-cover bg-center cursor-pointer"
                      style={{ backgroundImage: `url(${product.imageUrl})` }}
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/80 to-transparent" />
                      {product.isPremium && (
                        <div className="absolute top-4 right-4 bg-luxury-gold text-luxury-black px-3 py-1 rounded-full text-xs font-semibold">
                          Premium
                        </div>
                      )}
                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromWishlist(item.id);
                        }}
                        className="absolute top-4 left-4 w-10 h-10 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                      >
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-luxury-gold mb-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-luxury-gold">
                          {formatPrice(product.price)}
                        </span>
                        {product.stockQuantity > 0 ? (
                          <span className="text-green-500 text-sm">Còn hàng</span>
                        ) : (
                          <span className="text-red-500 text-sm">Hết hàng</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMoveToCart(item.id, product)}
                          disabled={product.stockQuantity === 0}
                          className="flex-1 px-4 py-2 bg-luxury-gold text-luxury-black font-semibold rounded-lg hover:bg-luxury-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Thêm vào giỏ
                        </button>
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="px-4 py-2 bg-luxury-gray text-white font-semibold rounded-lg hover:bg-luxury-gray/80 transition-colors border border-luxury-gold/20"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Wishlist;
