import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import Section from '../components/Section';
import Footer from '../components/Footer';
import { productAPI, mockProducts } from '../services/api';

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const response = await productAPI.getPremium();

      if (response.status === 'success' && response.data?.length > 0) {
        setProducts(response.data);
      } else {
        // Use mock data if API fails
        setProducts(mockProducts);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-luxury-black">
      <Hero />

      {/* Premium Product Showcase */}
      <Section className="bg-gradient-to-b from-luxury-black via-luxury-gray to-luxury-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-serif font-bold text-luxury-white mb-4">
              Exclusive Collection
            </h2>
            <p className="text-luxury-white/60 text-lg max-w-2xl mx-auto mb-8">
              Handpicked treasures for those who appreciate the extraordinary
            </p>
            <Link
              to="/products"
              className="inline-block px-8 py-3 gold-gradient rounded-full font-medium text-luxury-black hover:scale-105 transition-transform duration-300"
            >
              View All Products
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-effect rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] bg-luxury-gray-light animate-pulse"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-luxury-gray-light rounded animate-pulse"></div>
                    <div className="h-4 bg-luxury-gray-light rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.slice(0, 6).map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </Section>

      <Footer />
    </div>
  );
}

export default Home;
