import { Outlet } from 'react-router-dom';

export const PublicLayout: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
    <Outlet />
  </div>
);
