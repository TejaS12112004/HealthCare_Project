import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LogOut, Users, CalendarOff, Bell, BrainCircuit, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Manage Doctors', href: '/admin/doctors', icon: Users },
  { name: 'Leave Management', href: '/admin/leave', icon: CalendarOff },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'LLM Monitor', href: '/admin/llm-monitor', icon: BrainCircuit },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/admin/dashboard" className="text-xl font-bold text-white flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-black">HM</span>
            </span>
            Admin Portal
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</span>
              <span className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase()}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-slate-950">
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
    </div>
  );
};
