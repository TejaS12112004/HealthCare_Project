import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

const UnauthorizedPage: React.FC = () => {
  const { role } = useAuth();

  const getDashboardLink = () => {
    switch (role) {
      case 'PATIENT': return '/patient/dashboard';
      case 'DOCTOR': return '/doctor/dashboard';
      case 'ADMIN': return '/admin/doctors';
      default: return '/login';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 w-full">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-900/50 mb-6">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-8">
            You do not have permission to access this page. Please return to your dashboard.
          </p>
          <Link to={getDashboardLink()}>
            <Button className="w-full">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
