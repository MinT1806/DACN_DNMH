import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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

    const result = await login(formData);
    setLoading(false);

    if (result.success) {
      navigate('/products');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="glass-effect rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-serif font-bold text-luxury-white mb-2">
              Welcome Back
            </h2>
            <p className="text-luxury-white/60">Login to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-luxury-white/80 text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white focus:outline-none focus:border-luxury-gold transition-colors"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-luxury-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white focus:outline-none focus:border-luxury-gold transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 gold-gradient rounded-lg font-medium text-luxury-black hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-luxury-white/60">
              Don't have an account?{' '}
              <Link to="/register" className="text-luxury-gold hover:text-luxury-gold-light transition-colors">
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-luxury-white/60 hover:text-luxury-white transition-colors text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
