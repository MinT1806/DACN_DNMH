import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { wishlistAPI, authAPI } from '../services/api';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product, index, wishlistItemId, onWishlistChange }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(!!wishlistItemId);
  const [wlId, setWlId] = useState(wishlistItemId || null);
  const [wlLoading, setWlLoading] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    const user = authAPI.getCurrentUser();
    if (!user) { navigate('/login'); return; }
    setWlLoading(true);
    try {
      if (inWishlist && wlId) {
        await wishlistAPI.remove(wlId);
        setInWishlist(false);
        setWlId(null);
        onWishlistChange && onWishlistChange(product.id, null);
      } else {
        const res = await wishlistAPI.add(user.id, product.id);
        const newId = res.data?.id;
        setInWishlist(true);
        setWlId(newId || null);
        onWishlistChange && onWishlistChange(product.id, newId);
      }
    } finally {
      setWlLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl glass-effect"
    >
      {/* Premium Badge */}
      {product.isPremium && (
        <div className="absolute top-4 left-4 z-20 px-3 py-1 gold-gradient rounded-full text-luxury-black text-xs font-bold tracking-wider">
          PREMIUM
        </div>
      )}

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        disabled={wlLoading}
        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-luxury-black/60 backdrop-blur flex items-center justify-center hover:bg-luxury-black transition-colors"
      >
        <svg
          className={`w-5 h-5 transition-colors ${inWishlist ? 'text-red-400 fill-red-400' : 'text-white'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Image Container */}
      <Link to={`/products/${product.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden">
          <motion.img
            src={product.imageUrl || product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.5 }}
            loading="lazy"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-t from-luxury-black via-luxury-black/30 to-transparent"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-serif font-semibold text-luxury-white group-hover:text-luxury-gold transition-colors duration-300 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-luxury-white/50 text-xs mt-0.5">{product.category}</p>
        </div>

        <div className="flex justify-between items-center pt-1">
          <p className="text-xl font-bold text-luxury-gold">
            {formatPrice(product.price)}
          </p>
          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              addedToCart
                ? 'bg-green-600 text-white'
                : product.stockQuantity === 0
                ? 'bg-luxury-gray/50 text-gray-500 cursor-not-allowed'
                : 'bg-luxury-gold text-luxury-black hover:bg-luxury-gold-light'
            }`}
          >
            {addedToCart ? 'âœ“ ÄÃ£ thÃªm' : product.stockQuantity === 0 ? 'Háº¿t hÃ ng' : '+ Giá» hÃ ng'}
          </button>
        </div>
      </div>

      {/* Glow effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.4 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.3)' }}
      />
    </motion.div>
  );
}
