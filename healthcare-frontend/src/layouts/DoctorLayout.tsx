import React from 'react';
import { AlertCircle, Calendar, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { PortalLayout, type PortalNavItem } from './PortalLayout';

const doctorNavItems: PortalNavItem[] = [
  { to: '/doctor/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
];

export const DoctorLayout: React.FC = () => {
  const { user } = useAuth();

  const handleConnectCalendar = async () => {
    try {
      const { data } = await apiClient.get<{ url: string }>(ENDPOINTS.CALENDAR.AUTH_URL);
      window.location.href = data.url;
    } catch (e) {
      alert('Failed to initiate calendar connection.');
    }
  };

  const calendarBanner = user?.googleCalendarConnected === false ? (
    <div className="bg-warning/10 border-b border-warning/20 px-6 py-2.5 flex items-center justify-between z-10 text-xs">
      <div className="flex items-center gap-2 text-warning font-medium">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Connect Google Calendar to automatically synchronize appointments and prevent scheduling conflicts.</span>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={handleConnectCalendar}
        className="text-xs h-7 px-2.5 ml-4 shrink-0"
      >
        Connect Now
      </Button>
    </div>
  ) : undefined;

  return (
    <PortalLayout
      role="DOCTOR"
      navItems={doctorNavItems}
      searchPlaceholder="Search patients or appointment records..."
      banner={calendarBanner}
      mobileNavType="bottom-nav"
    />
  );
};

export default DoctorLayout;
