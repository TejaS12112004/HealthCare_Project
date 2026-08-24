import React from 'react';
import { Bell, BrainCircuit, CalendarOff, Home, Users } from 'lucide-react';
import { PortalLayout, type PortalNavItem } from './PortalLayout';

const adminNavItems: PortalNavItem[] = [
  { to: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/admin/doctors', icon: Users, label: 'Manage Doctors' },
  { to: '/admin/leave', icon: CalendarOff, label: 'Leave Management' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/llm-monitor', icon: BrainCircuit, label: 'LLM Monitor' },
];

export const AdminLayout: React.FC = () => {
  return (
    <PortalLayout
      role="ADMIN"
      navItems={adminNavItems}
      searchPlaceholder="Search system records, logs, staff..."
      mobileNavType="drawer"
    />
  );
};

export default AdminLayout;
