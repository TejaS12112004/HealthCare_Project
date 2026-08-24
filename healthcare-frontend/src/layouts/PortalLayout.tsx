import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { 
  Bell, 
  LogOut, 
  Menu, 
  Search, 
  User as UserIcon, 
  Key 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Drawer } from '../components/ui/Drawer';
import { IconButton } from '../components/ui/IconButton';
import { ChangePasswordModal } from '../features/auth/components/ChangePasswordModal';
import { cn } from '../lib/utils';

export interface PortalNavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: string | number;
}

interface PortalLayoutProps {
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  navItems: PortalNavItem[];
  searchPlaceholder?: string;
  banner?: React.ReactNode;
  mobileNavType?: 'bottom-nav' | 'drawer';
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  role,
  navItems,
  searchPlaceholder,
  banner,
  mobileNavType = 'bottom-nav',
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const roleTitle = role === 'PATIENT' ? 'Patient' : role === 'DOCTOR' ? 'Doctor' : 'Admin';
  
  const userInitials = user 
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const displayName = role === 'DOCTOR' 
    ? `Dr. ${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    : `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row text-ink font-body selection:bg-accent/20 selection:text-accent">
      {/* ── Desktop Fixed Sidebar (240px) ──────────────────────────────────── */}
      <aside className="hidden md:flex w-[240px] flex-shrink-0 bg-surface border-r border-ink/5 flex-col fixed top-0 bottom-0 left-0 z-30">
        {/* Brand & Wordmark Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-ink/5">
          <Link to="/" className="text-xl font-bold font-display text-ink flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold font-display text-sm shadow-sm transition-transform duration-200 group-hover:scale-105">
              W
            </div>
            <span className="tracking-tight">WellPoint</span>
          </Link>
          <span className="text-[10px] font-bold font-body uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent">
            {roleTitle}
          </span>
        </div>

        {/* Navigation Items with Animated Active Indicator */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => {
            const isActive = location.pathname === to || (to !== `/${role.toLowerCase()}/dashboard` && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-accent font-semibold bg-accent/8'
                    : 'text-ink/60 hover:text-ink hover:bg-ink/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId={`active-nav-indicator-${role}`}
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-accent rounded-r-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={cn('h-4 w-4 transition-colors', isActive ? 'text-accent' : 'text-ink/40 group-hover:text-ink/70')} />
                <span className="flex-1 truncate">{label}</span>
                {badge !== undefined && (
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', isActive ? 'bg-accent text-white' : 'bg-ink/10 text-ink/70')}>
                    {badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Quick Controls */}
        <div className="p-3 border-t border-ink/5 bg-surface/50">
          <div className="flex items-center gap-3 px-2.5 py-2 mb-2 rounded-lg bg-bg border border-ink/5">
            <div className="h-8 w-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center border border-accent/20 shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink truncate font-display">
                {displayName || 'User'}
              </p>
              <p className="text-[10px] text-ink/50 truncate font-body">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-1">
            {role === 'DOCTOR' && (
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors text-left"
              >
                <Key className="h-3.5 w-3.5 text-ink/40" />
                Change Password
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-danger/80 hover:text-danger hover:bg-danger/10 transition-colors text-left"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:pl-[240px] min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-surface/80 backdrop-blur-md border-b border-ink/5 px-4 md:px-8 flex items-center justify-between gap-4">
          {/* Mobile Menu Trigger & Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            {mobileNavType === 'drawer' && (
              <IconButton 
                variant="ghost" 
                size="sm" 
                className="md:hidden text-ink/60"
                onClick={() => setMobileDrawerOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </IconButton>
            )}

            {/* Mobile Brand for Bottom Nav Mode */}
            {mobileNavType === 'bottom-nav' && (
              <Link to="/" className="md:hidden flex items-center gap-2 font-display font-bold text-ink text-base mr-2">
                <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  W
                </div>
                <span>WellPoint</span>
              </Link>
            )}

            {searchPlaceholder && (
              <div className="relative w-full hidden sm:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-9 pl-9 pr-4 text-xs font-body rounded-lg bg-bg border border-ink/10 text-ink placeholder:text-ink/40 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                />
              </div>
            )}
          </div>

          {/* Topbar Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Indicator */}
            <div className="relative">
              <IconButton variant="ghost" size="sm" className="relative text-ink/60 hover:text-ink">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-surface animate-pulse" />
              </IconButton>
            </div>

            <div className="h-4 w-px bg-ink/5 mx-1" />

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="h-7 w-7 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center border border-accent/20">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <span className="hidden sm:inline text-xs font-medium text-ink font-body">
                {displayName}
              </span>
            </div>
          </div>
        </header>

        {/* Optional Notification Banner */}
        {banner}

        {/* Dynamic Routed Views */}
        <main className="flex-1 pb-20 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet context={{ searchQuery }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation (Patient & Doctor) ────────────────────── */}
      {mobileNavType === 'bottom-nav' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-ink/5 px-2 py-1.5 flex justify-around items-center shadow-lg">
          {navItems.slice(0, 4).map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || (to !== `/${role.toLowerCase()}/dashboard` && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors relative',
                  isActive ? 'text-accent font-bold' : 'text-ink/50 hover:text-ink'
                )}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span>{label}</span>
                {isActive && (
                  <motion.div 
                    layoutId={`mobile-active-${role}`} 
                    className="w-1 h-1 bg-accent rounded-full mt-0.5" 
                  />
                )}
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium text-danger/80"
          >
            <LogOut className="h-5 w-5 mb-0.5" />
            <span>Sign Out</span>
          </button>
        </nav>
      )}

      {/* ── Mobile Slide-in Drawer (Admin) ─────────────────────────────────── */}
      {mobileNavType === 'drawer' && (
        <Drawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          title="Admin Menu"
          position="left"
        >
          <div className="flex flex-col h-full justify-between">
            <nav className="space-y-1.5">
              {navItems.map(({ to, icon: Icon, label, badge }) => {
                const isActive = location.pathname === to;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive ? 'bg-accent/10 text-accent font-bold' : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{label}</span>
                    {badge !== undefined && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold">
                        {badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-ink/5">
              <button
                type="button"
                onClick={() => { setMobileDrawerOpen(false); logout(); }}
                className="flex items-center gap-3 w-full px-3.5 py-3 rounded-lg text-sm font-medium text-danger bg-danger/10 hover:bg-danger/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Doctor Password Change Modal */}
      {role === 'DOCTOR' && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}
    </div>
  );
};
