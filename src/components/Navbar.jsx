import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NAV_LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/products', label: 'Sản phẩm' },
];

const AUTH_LINKS = [
  { to: '/ai-stylist', label: 'AI Stylist' },
  { to: '/orders', label: 'Đơn hàng' },
  { to: '/wishlist', label: 'Yêu thích' },
];

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartCount } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const linkClass = (path) =>
    `transition-colors font-medium ${isActive(path) ? 'text-luxury-gold' : 'text-luxury-white hover:text-luxury-gold'}`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-luxury-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="text-2xl font-serif font-bold text-gradient flex-shrink-0">
            LUXE
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={linkClass(l.to)}>{l.label}</Link>
            ))}
            {isAuthenticated && AUTH_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={linkClass(l.to)}>{l.label}</Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative p-2 text-luxury-white hover:text-luxury-gold transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-luxury-gold text-luxury-black text-xs rounded-full flex items-center justify-center font-bold">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/profile" className="text-luxury-white/80 text-sm hover:text-luxury-gold transition-colors">
                  {user?.firstName || user?.username}
                </Link>
                <button onClick={logout}
                  className="px-4 py-2 glass-effect border border-luxury-white/20 rounded-lg text-luxury-white hover:border-luxury-gold transition-colors text-sm">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 glass-effect border border-luxury-white/20 rounded-lg text-luxury-white hover:border-luxury-gold transition-colors text-sm">
                  Đăng nhập
                </Link>
                <Link to="/register" className="px-4 py-2 gold-gradient rounded-lg text-luxury-black hover:scale-105 transition-transform duration-300 text-sm font-medium">
                  Đăng ký
                </Link>
              </div>
            )}

            <button className="md:hidden p-2 text-luxury-white hover:text-luxury-gold transition-colors"
              onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-luxury-black/95 backdrop-blur border-t border-luxury-white/10 px-4 py-4 space-y-1">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
              className={`block py-2.5 px-3 rounded-lg text-sm transition-colors ${isActive(l.to) ? 'text-luxury-gold bg-luxury-gold/10' : 'text-luxury-white hover:text-luxury-gold hover:bg-luxury-white/5'}`}>
              {l.label}
            </Link>
          ))}
          {isAuthenticated && AUTH_LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
              className={`block py-2.5 px-3 rounded-lg text-sm transition-colors ${isActive(l.to) ? 'text-luxury-gold bg-luxury-gold/10' : 'text-luxury-white hover:text-luxury-gold hover:bg-luxury-white/5'}`}>
              {l.label}
            </Link>
          ))}
          <div className="border-t border-luxury-white/10 pt-3 mt-3 space-y-2">
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm text-luxury-white hover:text-luxury-gold hover:bg-luxury-white/5 transition-colors">
                  Hồ sơ ({user?.firstName || user?.username})
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm text-luxury-white hover:text-luxury-gold hover:bg-luxury-white/5 transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm text-luxury-gold hover:bg-luxury-gold/10 transition-colors">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;