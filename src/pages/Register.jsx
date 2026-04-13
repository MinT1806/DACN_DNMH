import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    setLoading(false);

    if (result.success) {
      navigate('/products');
    } else {
      setError(result.message || 'Registration failed');
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
              Join Us
            </h2>
            <p className="text-luxury-white/60">Create your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-luxury-white/80 text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white focus:outline-none focus:border-luxury-gold transition-colors"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-luxury-white/80 text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white focus:outline-none focus:border-luxury-gold transition-colors"
                  placeholder="Doe"
                />
              </div>
            </div>

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
                placeholder="johndoe"
              />
            </div>

            <div>
              <label className="block text-luxury-white/80 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white focus:outline-none focus:border-luxury-gold transition-colors"
                placeholder="john@example.com"
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
                minLength={6}
                className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white focus:outline-none focus:border-luxury-gold transition-colors"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label className="block text-luxury-white/80 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-luxury-gray border border-luxury-white/10 rounded-lg text-luxury-white focus:outline-none focus:border-luxury-gold transition-colors"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 gold-gradient rounded-lg font-medium text-luxury-black hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-luxury-white/60">
              Already have an account?{' '}
              <Link to="/login" className="text-luxury-gold hover:text-luxury-gold-light transition-colors">
                Login here
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

export default Register;
