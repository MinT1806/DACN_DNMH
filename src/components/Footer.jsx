import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Company: ['About', 'Careers', 'Press', 'Blog'],
    Support: ['Contact', 'FAQ', 'Shipping', 'Returns'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
  };

  const socialLinks = [
    { name: 'Instagram', icon: '📷' },
    { name: 'Facebook', icon: '📘' },
    { name: 'Twitter', icon: '🐦' },
    { name: 'LinkedIn', icon: '💼' },
  ];

  return (
    <footer className="relative border-t border-luxury-white/10">
      {/* Glass effect background */}
      <div className="absolute inset-0 glass-effect-dark"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-serif font-bold text-gradient mb-4"
            >
              LUXE
            </motion.h3>
            <p className="text-luxury-white/60 leading-relaxed mb-6">
              Curating the world's finest luxury goods for the discerning few.
              Excellence in every detail.
            </p>
            {/* Newsletter */}
            <div className="space-y-3">
              <p className="text-luxury-white/80 font-medium">Join Our Inner Circle</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-2 glass-effect rounded-lg border border-luxury-white/10 bg-luxury-black/50 text-luxury-white placeholder:text-luxury-white/30 focus:outline-none focus:border-luxury-gold transition-colors"
                />
                <button className="px-6 py-2 gold-gradient rounded-lg font-medium text-luxury-black hover:scale-105 transition-transform">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Links sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-serif font-semibold text-luxury-white mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-luxury-white/60 hover:text-luxury-gold transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-luxury-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <p className="text-luxury-white/40 text-sm">
            © {currentYear} LUXE. All rights reserved.
          </p>

          {/* Social links */}
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <motion.a
                key={social.name}
                href="#"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 glass-effect rounded-full flex items-center justify-center text-xl border border-luxury-white/10 hover:border-luxury-gold transition-colors duration-300"
                aria-label={social.name}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>

          {/* Additional links */}
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-luxury-white/60 hover:text-luxury-gold transition-colors">
              Privacy
            </a>
            <a href="#" className="text-luxury-white/60 hover:text-luxury-gold transition-colors">
              Terms
            </a>
            <a href="#" className="text-luxury-white/60 hover:text-luxury-gold transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
