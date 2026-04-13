import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function Section({ children, className = '' }) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      className={`py-20 md:py-32 px-4 ${className}`}
    >
      {children}
    </motion.section>
  );
}
