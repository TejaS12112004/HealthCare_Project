import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SmoothScroll } from '../lib/motion/SmoothScroll';
import { CustomCursor } from '../components/CustomCursor';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/unauthorized';

  return (
    <SmoothScroll>
      <CustomCursor />
      <div className="min-h-screen flex flex-col bg-background selection:bg-accent/20">
        {!isAuthPage && <Navbar />}
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
        {!isAuthPage && <Footer />}
      </div>
    </SmoothScroll>
  );
};
