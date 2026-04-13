/**
 * Format a number as USD currency (prices stored in DB are USD)
 */
export const formatPrice = (price) => {
  if (price == null) return '$0';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Map order status code to Vietnamese label
 */
export const getStatusLabel = (status) => {
  const map = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao hàng',
    DELIVERED: 'Đã giao hàng',
    CANCELLED: 'Đã hủy',
  };
  return map[status] || status;
};

/**
 * Map order status to Tailwind color class
 */
export const getStatusColor = (status) => {
  const map = {
    PENDING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    CONFIRMED: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    PROCESSING: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    SHIPPED: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    DELIVERED: 'text-green-400 bg-green-400/10 border-green-400/30',
    CANCELLED: 'text-red-400 bg-red-400/10 border-red-400/30',
  };
  return map[status] || 'text-gray-400 bg-gray-400/10 border-gray-400/30';
};

/**
 * Format a date to Vietnamese locale string
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
