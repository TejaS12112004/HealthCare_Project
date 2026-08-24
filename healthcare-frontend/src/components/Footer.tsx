import { FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';
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
          <div className="flex gap-4">
            <MagneticButton><a href="#" className="p-2 bg-slate-800 rounded-full flex hover:bg-accent hover:text-white transition-colors" data-cursor="hover"><FaTwitter className="w-4 h-4" /></a></MagneticButton>
            <MagneticButton><a href="#" className="p-2 bg-slate-800 rounded-full flex hover:bg-accent hover:text-white transition-colors" data-cursor="hover"><FaLinkedin className="w-4 h-4" /></a></MagneticButton>
            <MagneticButton><a href="#" className="p-2 bg-slate-800 rounded-full flex hover:bg-accent hover:text-white transition-colors" data-cursor="hover"><FaGithub className="w-4 h-4" /></a></MagneticButton>
          </div>
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
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-cursor="hover">HIPAA Compliance</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} WellPoint. All rights reserved.</p>
        <p>Made with ❤️ for better healthcare.</p>
      </div>
    </footer>
  );
};
