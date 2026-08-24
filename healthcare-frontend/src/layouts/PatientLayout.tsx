import React from 'react';
import { Calendar, Home, Search } from 'lucide-react';
import { PortalLayout, type PortalNavItem } from './PortalLayout';

const patientNavItems: PortalNavItem[] = [
  { to: '/patient/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/patient/search', icon: Search, label: 'Find Doctors' },
  { to: '/patient/appointments', icon: Calendar, label: 'Appointments' },
];

export const PatientLayout: React.FC = () => {
  return (
    <PortalLayout
      role="PATIENT"
      navItems={patientNavItems}
      searchPlaceholder="Search doctors, specialisations..."
      mobileNavType="bottom-nav"
    />
  );
};

export default PatientLayout;
