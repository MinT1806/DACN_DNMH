import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { userAPI, authAPI } from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    address: '',
    style: '',
    favoriteColor: '',
  });

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile(currentUser.id);
        if (response.status === 'success' && response.data) {
          setUser(response.data);
          setFormData({
            username: response.data.username || '',
            email: response.data.email || '',
            fullName: response.data.fullName || '',
            phone: response.data.phone || '',
            address: response.data.address || '',
            style: response.data.style || '',
            favoriteColor: response.data.favoriteColor || '',
          });
        } else {
          setError('Không thể tải hồ sơ');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Đã xảy ra lỗi khi tải hồ sơ');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await userAPI.updateProfile(user.id, formData);
      if (response.status === 'success') {
        setUser(response.data);
        setSuccessMessage('Cập nhật hồ sơ thành công!');
        setIsEditing(false);

        // Update local storage if needed
        const currentUser = authAPI.getCurrentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, ...response.data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        setError(response.message || 'Không thể cập nhật hồ sơ');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Đã xảy ra lỗi khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        style: user.style || '',
        favoriteColor: user.favoriteColor || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="text-luxury-gold text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-playfair text-luxury-gold">Hồ sơ của tôi</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-luxury-gold text-luxury-black font-semibold rounded-lg hover:bg-luxury-gold-light transition-colors"
              >
                Chỉnh sửa
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-500/20 border border-green-500 text-green-500 p-4 rounded-lg mb-6">
              {successMessage}
            </div>
          )}

          <div className="bg-luxury-gray/50 backdrop-blur-lg rounded-lg p-8 border border-luxury-gold/20">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex items-center space-x-6 pb-6 border-b border-luxury-gold/20">
                  <div className="w-24 h-24 bg-luxury-gold/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-luxury-gold"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl text-white font-semibold">{user?.fullName || user?.username}</h3>
                    <p className="text-gray-400">{user?.email}</p>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-400 mb-2">Tên đăng nhập</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full bg-luxury-black/50 border border-luxury-gold/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-luxury-gold disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full bg-luxury-black/50 border border-luxury-gold/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-luxury-gold disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Họ và tên</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full bg-luxury-black/50 border border-luxury-gold/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-luxury-gold disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Số điện thoại</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full bg-luxury-black/50 border border-luxury-gold/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-luxury-gold disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-gray-400 mb-2">Địa chỉ</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows="3"
                    className="w-full bg-luxury-black/50 border border-luxury-gold/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-luxury-gold disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  />
                </div>

                {/* Style Preferences */}
                <div className="pt-6 border-t border-luxury-gold/20">
                  <h3 className="text-luxury-gold font-semibold mb-4">Sở thích phong cách</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-400 mb-2">Phong cách yêu thích</label>
                      <select
                        name="style"
                        value={formData.style}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full bg-luxury-black/50 border border-luxury-gold/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-luxury-gold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Chọn phong cách...</option>
                        <option value="casual">Thông thường</option>
                        <option value="formal">Lịch sự</option>
                        <option value="sporty">Thể thao</option>
                        <option value="elegant">Thanh lịch</option>
                        <option value="vintage">Cổ điển</option>
                        <option value="modern">Hiện đại</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">Màu sắc yêu thích</label>
                      <input
                        type="text"
                        name="favoriteColor"
                        value={formData.favoriteColor}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g., Black, Navy, Red"
                        className="w-full bg-luxury-black/50 border border-luxury-gold/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-luxury-gold disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-luxury-gold text-luxury-black font-semibold rounded-lg hover:bg-luxury-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-luxury-gray text-white font-semibold rounded-lg hover:bg-luxury-gray/80 transition-colors border border-luxury-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Quick Links */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/orders')}
              className="bg-luxury-gray/50 backdrop-blur-lg rounded-lg p-4 border border-luxury-gold/20 hover:border-luxury-gold/40 transition-all text-center"
            >
              <div className="text-luxury-gold font-semibold mb-1">Lịch sử đơn hàng</div>
              <div className="text-gray-400 text-sm">Xem các đơn hàng</div>
            </button>
            <button
              onClick={() => navigate('/wishlist')}
              className="bg-luxury-gray/50 backdrop-blur-lg rounded-lg p-4 border border-luxury-gold/20 hover:border-luxury-gold/40 transition-all text-center"
            >
              <div className="text-luxury-gold font-semibold mb-1">Yêu thích</div>
              <div className="text-gray-400 text-sm">Sản phẩm đã lưu</div>
            </button>
            <button
              onClick={() => navigate('/ai-stylist')}
              className="bg-luxury-gray/50 backdrop-blur-lg rounded-lg p-4 border border-luxury-gold/20 hover:border-luxury-gold/40 transition-all text-center"
            >
              <div className="text-luxury-gold font-semibold mb-1">AI Stylist</div>
              <div className="text-gray-400 text-sm">Nhận tư vấn phong cách</div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
