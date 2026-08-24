import { Heart, Activity, Globe, MessageCircle, Mail } from 'lucide-react';
import { MagneticButton } from '../lib/motion/MagneticButton';

export const Footer = () => {
  return (
    <footer className="bg-primary text-slate-300 py-16 px-6 md:px-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 text-white font-display font-bold text-2xl mb-4">
            <div className="w-8 h-8 bg-accent rounded-lg" />
            WellPoint
          </div>
          <p className="text-sm text-slate-400 mb-6 max-w-xs">
            AI-assisted care coordination platform built for modern healthcare providers.
          </p>
        </div>

        <div>
          <h3 className="text-white font-medium mb-4">Product</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">Features</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">For Doctors</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">For Patients</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-medium mb-4">Company</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">About</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">Blog</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-medium mb-4">Legal</h3>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-500 hover:text-accent transition-colors">
                <span className="sr-only">Website</span>
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-500 hover:text-accent transition-colors">
                <span className="sr-only">Community</span>
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-500 hover:text-accent transition-colors">
                <span className="sr-only">Contact</span>
                <Mail className="h-5 w-5" />
              </a>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} WellPoint. All rights reserved.</p>
        <p>Made with ❤️ for better healthcare.</p>
      </div>
    </footer>
  );
};
