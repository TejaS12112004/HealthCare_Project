import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Home, LogOut, AlertCircle, ClipboardList, User, Key } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { ChangePasswordModal } from '../features/auth/components/ChangePasswordModal';

const navItems = [
  { to: '/doctor/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
];

export const DoctorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleConnectCalendar = async () => {
    try {
      const { data } = await apiClient.get<{ url: string }>(ENDPOINTS.CALENDAR.AUTH_URL);
      window.location.href = data.url;
    } catch (e) {
      alert('Failed to initiate calendar connection.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-800">
          <Link to="/doctor/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">Doctor Portal</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Dr. {user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <Key className="h-4 w-4" />
              Change password
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-slate-950">
        {user?.googleCalendarConnected === false && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-3 flex items-center justify-between z-20 relative">
            <div className="flex items-center gap-2 text-amber-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Connect Google Calendar to automatically sync your appointments.</span>
            </div>
            <button
              onClick={handleConnectCalendar}
              className="text-xs font-medium bg-amber-500 text-amber-950 px-3 py-1.5 rounded hover:bg-amber-400 transition-colors"
            >
              Connect Now
            </button>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="p-8 h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
};
