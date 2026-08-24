import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { MagneticButton } from '../lib/motion/MagneticButton';
import { Reveal } from '../lib/motion/Reveal';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  const navHeight = useTransform(scrollY, [0, 60], ['80px', '60px']);
  const bg = useTransform(scrollY, [0, 60], ["rgba(247, 248, 250, 0)", "rgba(247, 248, 250, 0.8)"]);
  const backdropBlur = useTransform(scrollY, [0, 60], ["blur(0px)", "blur(12px)"]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Product', href: '#features' },
    { label: 'For Doctors', href: '#doctors' },
    { label: 'For Patients', href: '#patients' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 border-b border-transparent"
        style={{
          height: navHeight,
          backgroundColor: bg,
          backdropFilter: backdropBlur,
          borderBottomColor: isScrolled ? 'rgba(11, 18, 32, 0.05)' : 'transparent',
        }}
      >
        <Link to="/" className="text-2xl font-bold font-display text-primary flex items-center gap-2" data-cursor="hover">
          <motion.div layoutId="logo-text-start" className="w-8 h-8 bg-accent rounded-lg" />
          WellPoint
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              data-cursor="hover"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-primary hover:opacity-70 transition-opacity" data-cursor="hover">
            Log in
          </Link>
          <MagneticButton>
            <Link to="/register" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 block" data-cursor="hover">
              Get Started
            </Link>
          </MagneticButton>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-primary" 
          onClick={() => setMobileMenuOpen(true)}
          data-cursor="hover"
        >
          <Menu className="w-6 h-6" />
        </button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col p-6"
          >
            <div className="flex justify-end">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-primary"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <div className="flex flex-col gap-6 mt-12 text-center">
              {navLinks.map((link, i) => (
                <Reveal key={link.label} delay={i * 0.1}>
                  <a
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-3xl font-display font-medium text-primary"
                  >
                    {link.label}
                  </a>
                </Reveal>
              ))}
              <div className="w-full h-px bg-slate-200 my-4" />
              <Reveal delay={0.4}>
                <Link to="/login" className="text-xl font-medium text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                  Log in
                </Link>
              </Reveal>
              <Reveal delay={0.5}>
                <Link to="/register" className="mt-4 px-6 py-4 bg-primary text-white text-xl font-medium rounded-2xl mx-8 shadow-xl shadow-primary/20 block" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </Reveal>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
