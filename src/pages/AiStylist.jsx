import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { aiStylistAPI, authAPI } from '../services/api';
import { useCart } from '../context/CartContext';

// Format price to Vietnamese VND
const formatVND = (price) => {
  if (!price && price !== 0) return '';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '';
  if (num < 100_000) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num * 25000);
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

// Clean AI response text (remove [SPIN], [FAB] markers)
const cleanResponseText = (text) => {
  if (!text) return '';
  return text.replace(/\[SPIN\]\s*/g, '').replace(/\[FAB\]\s*/g, '').trim();
};

// Render response with simple bold (**text**) support
const RenderResponse = ({ text }) => {
  const cleaned = cleanResponseText(text);
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-luxury-gold">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const AiStylist = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [addedToCart, setAddedToCart] = useState({});
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (!user || !user.id) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    const fetchHistory = async () => {
      try {
        const response = await aiStylistAPI.getHistory();
        if (response.status === 'success' && Array.isArray(response.data)) {
          const formattedHistory = response.data.flatMap((chat) => {
            const timestamp = chat.createdAt ? new Date(chat.createdAt) : new Date();
            const items = [];
            if (chat.prompt) {
              items.push({ id: `${chat.id}-user`, text: chat.prompt, sender: 'user', timestamp });
            }
            if (chat.response) {
              items.push({
                id: `${chat.id}-ai`,
                text: chat.response,
                sender: 'ai',
                timestamp,
                recommendations: [],
              });
            }
            return items;
          });
          formattedHistory.sort((a, b) => a.timestamp - b.timestamp);
          setMessages(formattedHistory);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || loading || !currentUser) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await aiStylistAPI.chat(currentUser.id, inputMessage);

      if (response.status === 'success' && response.data) {
        const aiMessage = {
          id: Date.now() + 1,
          text: response.data.response || response.data.aiResponse || response.data.message || 'Mình đã sẵn sàng tư vấn cho bạn!',
          sender: 'ai',
          timestamp: new Date(),
          recommendations: response.data.recommendedProducts || response.data.recommendations || [],
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          text: 'Xin lỗi, đã xảy ra lỗi. Bạn vui lòng thử lại nhé!',
          sender: 'ai',
          timestamp: new Date(),
          recommendations: [],
        }]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: 'Xin lỗi, không thể kết nối đến AI Stylist. Vui lòng kiểm tra kết nối và thử lại!',
        sender: 'ai',
        timestamp: new Date(),
        recommendations: [],
      }]);
    } finally {
      setLoading(false);
    }
  }, [inputMessage, loading, currentUser]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedToCart((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedToCart((prev) => ({ ...prev, [product.id]: false })), 2000);
  };

  const handleClearHistory = async () => {
    if (!currentUser) return;
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện không?')) return;
    try {
      await aiStylistAPI.clearHistory();
      setMessages([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  const quickPrompts = [
    { label: '👔 Outfit đi làm lịch sự', value: 'Tôi cần gợi ý outfit đi làm lịch sự và chuyên nghiệp' },
    { label: '🎉 Trang phục dự tiệc sang trọng', value: 'Tôi đang cần trang phục dự tiệc sang trọng, gợi ý giúp tôi nhé' },
    { label: '☀️ Đồ mặc mùa hè thoáng mát', value: 'Gợi ý cho tôi những sản phẩm thời trang mùa hè thoáng mát' },
    { label: '💰 Phụ kiện cao cấp dưới 5 triệu', value: 'Gợi ý phụ kiện cao cấp với ngân sách dưới 5 triệu' },
  ];

  if (historyLoading) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="text-luxury-gold text-xl">Đang tải AI Stylist...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-luxury-gray/50 backdrop-blur-lg rounded-lg border border-luxury-gold/20 overflow-hidden"
          style={{ height: 'calc(100vh - 12rem)' }}
        >
          {/* Header */}
          <div className="bg-luxury-black/50 p-4 border-b border-luxury-gold/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-luxury-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-playfair text-luxury-gold">AI Fashion Stylist</h1>
                <p className="text-gray-400 text-xs">Tư vấn thời trang cá nhân hóa</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-gray-500 hover:text-red-400 transition-colors text-xs flex items-center space-x-1 px-3 py-1.5 rounded border border-gray-700 hover:border-red-400"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Xóa hội thoại</span>
              </button>
            )}
          </div>

          {/* Messages Container */}
          <div className="overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 180px)' }}>
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 bg-luxury-gold/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-luxury-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg text-gray-300 mb-1">Bắt đầu trò chuyện</h3>
                <p className="text-gray-500 text-sm mb-6">Hỏi mình bất cứ điều gì về thời trang!</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(prompt.value)}
                      className="text-left px-4 py-3 bg-luxury-black/50 border border-luxury-gold/20 rounded-lg text-gray-300 hover:border-luxury-gold/50 hover:text-luxury-gold hover:bg-luxury-gold/5 transition-all text-sm"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'ai' && (
                      <div className="w-7 h-7 bg-luxury-gold/20 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    )}

                    <div className={`max-w-[75%] ${message.sender === 'user' ? '' : 'flex-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.sender === 'user'
                            ? 'bg-luxury-gold text-luxury-black rounded-tr-sm'
                            : 'bg-luxury-black/60 text-white border border-luxury-gold/20 rounded-tl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.sender === 'ai'
                            ? <RenderResponse text={message.text} />
                            : message.text
                          }
                        </p>
                        <p className={`text-xs mt-1.5 ${message.sender === 'user' ? 'text-luxury-black/60' : 'text-gray-500'}`}>
                          {message.timestamp instanceof Date
                            ? message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                            : new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Product Recommendations */}
                      {message.recommendations && message.recommendations.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-luxury-gold font-semibold text-xs uppercase tracking-wide ml-1">
                            Sản phẩm gợi ý ({message.recommendations.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {message.recommendations.map((product) => (
                              <div
                                key={product.id}
                                className="bg-luxury-black/60 border border-luxury-gold/15 rounded-xl overflow-hidden hover:border-luxury-gold/40 transition-all group"
                              >
                                {product.imageUrl && (
                                  <div
                                    className="w-full h-32 overflow-hidden cursor-pointer"
                                    onClick={() => navigate(`/products/${product.id}`)}
                                  >
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  </div>
                                )}
                                <div className="p-3">
                                  <p
                                    className="font-semibold text-sm text-white cursor-pointer hover:text-luxury-gold transition-colors line-clamp-1"
                                    onClick={() => navigate(`/products/${product.id}`)}
                                  >
                                    {product.name}
                                  </p>
                                  {product.category && (
                                    <p className="text-gray-500 text-xs mt-0.5">{product.category}</p>
                                  )}
                                  <p className="text-luxury-gold font-bold text-sm mt-1">
                                    {formatVND(product.price)}
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => navigate(`/products/${product.id}`)}
                                      className="flex-1 text-xs py-1.5 border border-luxury-gold/30 rounded-lg text-luxury-gold hover:bg-luxury-gold/10 transition-colors"
                                    >
                                      Xem chi tiết
                                    </button>
                                    <button
                                      onClick={() => handleAddToCart(product)}
                                      className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                                        addedToCart[product.id]
                                          ? 'bg-green-600 text-white'
                                          : 'bg-luxury-gold text-luxury-black hover:bg-luxury-gold-light'
                                      }`}
                                    >
                                      {addedToCart[product.id] ? '✓ Đã thêm' : 'Thêm vào giỏ'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {message.sender === 'user' && (
                      <div className="w-7 h-7 bg-luxury-gold/20 rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start items-end space-x-2"
              >
                <div className="w-7 h-7 bg-luxury-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-luxury-black/60 border border-luxury-gold/20 rounded-2xl rounded-tl-sm px-4 py-3">
                  <span className="text-gray-400 text-sm mr-2">Đang soạn câu trả lời</span>
                  <span className="inline-flex space-x-1">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-luxury-gold rounded-full animate-bounce inline-block"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-luxury-black/50 border-t border-luxury-gold/20">
            {messages.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputMessage(prompt.value)}
                    disabled={loading}
                    className="text-xs whitespace-nowrap px-3 py-1.5 bg-luxury-black/50 border border-luxury-gold/20 rounded-full text-gray-400 hover:text-luxury-gold hover:border-luxury-gold/40 transition-all disabled:opacity-40"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex space-x-3">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi về thời trang... (Enter để gửi, Shift+Enter xuống dòng)"
                className="flex-1 bg-luxury-gray border border-luxury-gold/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-luxury-gold/60 resize-none text-sm leading-relaxed"
                rows="2"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                className="px-5 bg-luxury-gold text-luxury-black font-semibold rounded-xl hover:bg-luxury-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-end"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AiStylist;
