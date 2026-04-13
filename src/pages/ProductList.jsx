import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, wishlistAPI, authAPI, mockProducts } from '../services/api';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import Footer from '../components/Footer';

const CATEGORIES = ['Tất cả', 'Timepieces', 'Jewelry', 'Accessories', 'Apparel'];
const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'name_asc', label: 'Tên A→Z' },
];
const PAGE_SIZE = 8;

function ProductList() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [sort, setSort] = useState('default');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [addedToCart, setAddedToCart] = useState({});
  // Map productId -> wishlistItemId
  const [wishlistMap, setWishlistMap] = useState({});
  const [wishlistLoading, setWishlistLoading] = useState({});

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const response = await productAPI.getAll();
      if (response.status === 'success' && response.data?.length > 0) {
        setAllProducts(response.data);
      } else {
        setAllProducts(mockProducts);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  // Load wishlist for the logged-in user
  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (!user) return;
    wishlistAPI.getAll(user.id).then((res) => {
      if (res.status === 'success' && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach((w) => {
          const pid = w.product?.id ?? w.productId;
          if (pid) map[pid] = w.id;
        });
        setWishlistMap(map);
      }
    });
  }, []);

  const filtered = useMemo(() => {
    let list = [...allProducts];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    if (category !== 'Tất cả') {
      list = list.filter((p) => p.category === category);
    }

    if (premiumOnly) {
      list = list.filter((p) => p.isPremium);
    }

    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'name_asc') list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [allProducts, search, category, premiumOnly, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, category, premiumOnly, sort]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    addToCart(product, 1);
    setAddedToCart((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedToCart((prev) => ({ ...prev, [product.id]: false })), 2000);
  };

  const handleWishlist = async (e, product) => {
    e.preventDefault();
    const user = authAPI.getCurrentUser();
    if (!user) { navigate('/login'); return; }
    setWishlistLoading((prev) => ({ ...prev, [product.id]: true }));
    try {
      if (wishlistMap[product.id]) {
        await wishlistAPI.remove(wishlistMap[product.id]);
        setWishlistMap((prev) => { const m = { ...prev }; delete m[product.id]; return m; });
      } else {
        const res = await wishlistAPI.add(user.id, product.id);
        const newId = res.data?.id;
        if (newId) setWishlistMap((prev) => ({ ...prev, [product.id]: newId }));
      }
    } finally {
      setWishlistLoading((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-luxury-gray to-luxury-black py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-luxury-white mb-3">Bộ Sưu Tập</h1>
            <p className="text-luxury-white/60 text-lg">Khám phá những tác phẩm độc đáo dành cho những ai biết trân trọng sự đặc biệt</p>
          </motion.div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-20 z-30 bg-luxury-black/95 backdrop-blur border-b border-luxury-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white placeholder-gray-500 focus:outline-none focus:border-luxury-gold transition-colors text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">✕</button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm transition-all ${
                    category === cat ? 'bg-luxury-gold text-luxury-black font-semibold' : 'glass-effect text-luxury-white hover:border-luxury-gold/50 border border-luxury-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort & Premium */}
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white text-sm focus:outline-none focus:border-luxury-gold"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                onClick={() => setPremiumOnly((v) => !v)}
                className={`px-4 py-2 rounded-lg text-sm transition-all border ${
                  premiumOnly ? 'bg-luxury-gold/20 border-luxury-gold text-luxury-gold' : 'border-luxury-white/10 text-luxury-white/60 hover:border-luxury-gold/40'
                }`}
              >
                Premium
              </button>
            </div>
          </div>

          {/* Result count */}
          <p className="text-gray-500 text-xs mt-2">
            {filtered.length} sản phẩm{search ? ` cho "${search}"` : ''}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-effect rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-luxury-gray-light" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-luxury-gray-light rounded" />
                  <div className="h-4 bg-luxury-gray-light rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 text-xl mb-4">Không tìm thấy sản phẩm nào</p>
            <button onClick={() => { setSearch(''); setCategory('Tất cả'); setPremiumOnly(false); }} className="text-luxury-gold hover:underline">
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginated.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="glass-effect rounded-2xl overflow-hidden group relative"
                >
                  {/* Wishlist */}
                  <button
                    onClick={(e) => handleWishlist(e, product)}
                    disabled={wishlistLoading[product.id]}
                    className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-luxury-black/60 backdrop-blur flex items-center justify-center hover:bg-luxury-black transition-colors"
                  >
                    <svg
                      className={`w-5 h-5 transition-colors ${wishlistMap[product.id] ? 'text-red-400 fill-red-400' : 'text-white'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Premium badge */}
                  {product.isPremium && (
                    <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-xs font-bold gold-gradient text-luxury-black rounded-full">PREMIUM</span>
                  )}

                  {/* Image */}
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-[3/4] overflow-hidden">
                      <img
                        src={product.imageUrl || product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-serif font-semibold text-luxury-white hover:text-luxury-gold transition-colors line-clamp-1 mb-0.5">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-luxury-white/50 mb-3">{product.category}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-luxury-gold">{formatPrice(product.price)}</p>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={product.stockQuantity === 0}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          addedToCart[product.id]
                            ? 'bg-green-600 text-white'
                            : product.stockQuantity === 0
                            ? 'bg-luxury-gray/50 text-gray-500 cursor-not-allowed'
                            : 'bg-luxury-gold text-luxury-black hover:bg-luxury-gold-light'
                        }`}
                      >
                        {addedToCart[product.id] ? '✓ Đã thêm' : product.stockQuantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 glass-effect rounded-lg text-luxury-white disabled:opacity-30 hover:border-luxury-gold border border-luxury-white/10 transition-colors"
            >
              ← Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  p === page ? 'gold-gradient text-luxury-black' : 'glass-effect text-luxury-white hover:border-luxury-gold border border-luxury-white/10'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 glass-effect rounded-lg text-luxury-white disabled:opacity-30 hover:border-luxury-gold border border-luxury-white/10 transition-colors"
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default ProductList;
