import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function Hero() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-luxury-black via-luxury-gray to-luxury-black">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-luxury-gold rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-luxury-gold-light rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        </div>
      </div>

      {/* Glass overlay */}
      <div className="absolute inset-0 glass-effect-dark"></div>

      {/* Content */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative z-10 text-center px-4 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-7xl md:text-9xl font-bold mb-6 tracking-wider">
            <span className="text-gradient">LUXE</span>
          </h1>
          <p className="text-2xl md:text-4xl font-light tracking-widest text-luxury-white/80 font-serif">
            Elevate Your Lifestyle
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-lg md:text-xl text-luxury-white/70 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Discover a curated collection of the world's most exclusive pieces.
          Where timeless elegance meets modern sophistication.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <button className="group relative px-10 py-4 gold-gradient rounded-full font-semibold text-luxury-black text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl glow-gold">
            <span className="relative z-10">Join Exclusive Membership</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>

          <button className="group px-10 py-4 glass-effect rounded-full font-medium text-luxury-white text-lg border border-luxury-gold/50 hover:border-luxury-gold transition-all duration-300 hover:scale-105 hover:glow-gold-sm">
            Explore Collection
          </button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className="text-luxury-white/50 text-sm tracking-widest">SCROLL</span>
            <div className="w-[1px] h-16 bg-gradient-to-b from-luxury-gold to-transparent"></div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
