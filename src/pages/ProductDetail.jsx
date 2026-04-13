import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI, wishlistAPI, reviewAPI, authAPI, mockProducts } from '../services/api';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import Footer from '../components/Footer';

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}
          disabled={readonly}
        >
          <svg
            className={`w-5 h-5 transition-colors ${star <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Wishlist
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const [wlLoading, setWlLoading] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const currentUser = authAPI.getCurrentUser();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const response = await productAPI.getById(id);
      if (response.status === 'success' && response.data) {
        setProduct(response.data);
      } else {
        const mock = mockProducts.find((p) => p.id === parseInt(id));
        setProduct(mock || null);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  // Load reviews
  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    reviewAPI.getByProduct(id).then((res) => {
      if (res.status === 'success') setReviews(res.data || []);
    }).finally(() => setReviewsLoading(false));
  }, [id]);

  // Check wishlist
  useEffect(() => {
    if (!currentUser || !id) return;
    wishlistAPI.getAll(currentUser.id).then((res) => {
      if (res.status === 'success' && Array.isArray(res.data)) {
        const item = res.data.find((w) => (w.product?.id ?? w.productId) === parseInt(id));
        if (item) { setInWishlist(true); setWishlistItemId(item.id); }
      }
    });
  }, [id, currentUser?.id]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleWishlist = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setWlLoading(true);
    try {
      if (inWishlist && wishlistItemId) {
        await wishlistAPI.remove(wishlistItemId);
        setInWishlist(false);
        setWishlistItemId(null);
      } else {
        const res = await wishlistAPI.add(currentUser.id, parseInt(id));
        setInWishlist(true);
        setWishlistItemId(res.data?.id || null);
      }
    } finally {
      setWlLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) { navigate('/login'); return; }
    if (!reviewForm.comment.trim()) { setReviewError('Vui lòng nhập nhận xét'); return; }
    setSubmittingReview(true);
    setReviewError('');
    const res = await reviewAPI.create({
      userId: currentUser.id,
      productId: parseInt(id),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
    });
    setSubmittingReview(false);
    if (res.status === 'success') {
      setReviews((prev) => [res.data, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);
    } else {
      setReviewError(res.message || 'Không thể gửi đánh giá');
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="text-luxury-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-serif text-luxury-white mb-4">Không tìm thấy sản phẩm</h2>
          <button onClick={() => navigate('/products')} className="px-6 py-3 gold-gradient rounded-lg text-luxury-black font-medium">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-luxury-gold transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-luxury-gold transition-colors">Sản phẩm</Link>
          <span>/</span>
          <span className="text-luxury-gold line-clamp-1">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          {/* Product Image */}
          <div className="relative glass-effect rounded-3xl overflow-hidden aspect-[4/5]">
            <img
              src={product.imageUrl || product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.isPremium && (
              <span className="absolute top-5 left-5 px-4 py-2 gold-gradient text-luxury-black text-sm font-bold rounded-full">
                PREMIUM
              </span>
            )}
            {product.stockQuantity === 0 && (
              <div className="absolute inset-0 bg-luxury-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-serif">Hết hàng</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-start space-y-5">
            <div>
              <h1 className="text-4xl font-serif font-bold text-luxury-white mb-2">{product.name}</h1>
              {avgRating && (
                <div className="flex items-center gap-2 mb-3">
                  <StarRating value={Math.round(avgRating)} readonly />
                  <span className="text-yellow-400 font-semibold">{avgRating}</span>
                  <span className="text-gray-500 text-sm">({reviews.length} đánh giá)</span>
                </div>
              )}
              <p className="text-4xl font-bold text-luxury-gold">{formatPrice(product.price)}</p>
            </div>

            <p className="text-luxury-white/70 leading-relaxed">
              {product.description || 'Sản phẩm cao cấp từ bộ sưu tập độc quyền, được chế tác từ những vật liệu thượng hạng với sự tỉ mỉ trong từng chi tiết.'}
            </p>

            {/* Attributes */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Danh mục', value: product.category },
                { label: 'Thương hiệu', value: product.brand },
                { label: 'Chất liệu', value: product.material },
                { label: 'Màu sắc', value: product.color },
                { label: 'Kích cỡ', value: product.size },
                {
                  label: 'Tình trạng',
                  value: product.stockQuantity > 0 ? `Còn hàng (${product.stockQuantity})` : 'Hết hàng',
                  colorClass: product.stockQuantity > 0 ? 'text-green-400' : 'text-red-400',
                },
              ]
                .filter((a) => a.value)
                .map((attr) => (
                  <div key={attr.label} className="glass-effect rounded-xl p-3">
                    <p className="text-gray-500 text-xs mb-0.5">{attr.label}</p>
                    <p className={`font-semibold text-sm ${attr.colorClass || 'text-luxury-white'}`}>{attr.value}</p>
                  </div>
                ))}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-luxury-white/80 text-sm">Số lượng:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 glass-effect rounded-lg text-luxury-white hover:text-luxury-gold transition-colors text-lg font-bold"
                >−</button>
                <span className="text-luxury-white font-semibold w-10 text-center text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity || 99, q + 1))}
                  disabled={quantity >= (product.stockQuantity || 99)}
                  className="w-9 h-9 glass-effect rounded-lg text-luxury-white hover:text-luxury-gold transition-colors text-lg font-bold disabled:opacity-30"
                >+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className={`flex-1 py-4 rounded-xl font-semibold text-base transition-all ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : 'gold-gradient text-luxury-black hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                }`}
              >
                {addedToCart ? '✓ Đã thêm vào giỏ hàng' : product.stockQuantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
              </button>
              <button
                onClick={handleWishlist}
                disabled={wlLoading}
                className={`px-5 py-4 rounded-xl border transition-all ${
                  inWishlist
                    ? 'bg-red-500/20 border-red-400 text-red-400 hover:bg-red-500/30'
                    : 'glass-effect border-luxury-white/20 text-luxury-white hover:border-luxury-gold'
                }`}
              >
                <svg className={`w-6 h-6 ${inWishlist ? 'fill-red-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => navigate('/cart')}
              className="w-full py-3 glass-effect border border-luxury-white/20 rounded-xl text-luxury-white hover:border-luxury-gold transition-colors text-sm"
            >
              Xem giỏ hàng → Thanh toán
            </button>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-luxury-white">
              Đánh giá sản phẩm
              {reviews.length > 0 && <span className="text-luxury-gold ml-2 text-lg">({reviews.length})</span>}
            </h2>
            {currentUser && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-5 py-2 gold-gradient rounded-lg text-luxury-black text-sm font-semibold"
              >
                Viết đánh giá
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-2xl p-6 mb-6"
            >
              <h3 className="text-lg font-semibold text-luxury-white mb-4">Đánh giá của bạn</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-luxury-white/70 text-sm mb-2">Xếp hạng</label>
                  <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))} />
                </div>
                <div>
                  <label className="block text-luxury-white/70 text-sm mb-2">Nhận xét</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    rows={3}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                    className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white placeholder-gray-500 focus:outline-none focus:border-luxury-gold resize-none text-sm"
                  />
                </div>
                {reviewError && <p className="text-red-400 text-sm">{reviewError}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={submittingReview} className="px-6 py-2 gold-gradient rounded-lg text-luxury-black font-semibold text-sm disabled:opacity-50">
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                  <button type="button" onClick={() => setShowReviewForm(false)} className="px-6 py-2 glass-effect border border-luxury-white/20 rounded-lg text-luxury-white text-sm">
                    Hủy
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Review List */}
          {reviewsLoading ? (
            <div className="text-gray-500 text-center py-8">Đang tải đánh giá...</div>
          ) : reviews.length === 0 ? (
            <div className="glass-effect rounded-2xl p-10 text-center">
              <p className="text-gray-500 mb-2">Chưa có đánh giá nào</p>
              {currentUser ? (
                <button onClick={() => setShowReviewForm(true)} className="text-luxury-gold hover:underline text-sm">
                  Hãy là người đầu tiên đánh giá!
                </button>
              ) : (
                <Link to="/login" className="text-luxury-gold hover:underline text-sm">Đăng nhập để đánh giá</Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-effect rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-luxury-white font-semibold text-sm">
                        {review.user?.username || review.username || 'Khách hàng'}
                      </span>
                      <div className="mt-1">
                        <StarRating value={review.rating} readonly />
                      </div>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                  <p className="text-luxury-white/70 text-sm leading-relaxed">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ProductDetail;
