import { Link } from 'react-router-dom';
import { Calendar, Search, Pill } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePatientAppointments } from './hooks/usePatientAPI';
import { AppointmentCard } from './components/AppointmentCard';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import type { Appointment } from '../../types/appointment';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: upcoming, isLoading: loadingUpcoming } = usePatientAppointments('CONFIRMED', 3);
  const { data: past, isLoading: loadingPast } = usePatientAppointments('COMPLETED', 5);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.firstName}!</h1>
        <p className="text-slate-400">Here's an overview of your healthcare journey.</p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Link to="/patient/search" className="group p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all">
          <div className="h-10 w-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Book Appointment</h3>
          <p className="text-sm text-slate-400">Find doctors and schedule visits</p>
        </Link>

        <Link to="/patient/appointments" className="group p-6 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all">
          <div className="h-10 w-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Calendar className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">My Appointments</h3>
          <p className="text-sm text-slate-400">View upcoming and past visits</p>
        </Link>

        <Link to="/patient/appointments" className="group p-6 rounded-2xl bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600/20 transition-all">
          <div className="h-10 w-10 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Pill className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Prescriptions</h3>
          <p className="text-sm text-slate-400">Check active medications</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Upcoming Visits</h2>
            <Link to="/patient/appointments" className="text-sm text-indigo-400 hover:text-indigo-300">View all</Link>
          </div>
          {loadingUpcoming ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : upcoming?.length ? (
            <div className="space-y-4">
              {upcoming.map((apt: Appointment) => <AppointmentCard key={apt.id} appointment={apt} />)}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No upcoming appointments scheduled.</p>
              <Link to="/patient/search">
                <Button variant="secondary" size="sm">Find a Doctor</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Past Visits</h2>
            <Link to="/patient/appointments" className="text-sm text-indigo-400 hover:text-indigo-300">View all</Link>
          </div>
          {loadingPast ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : past?.length ? (
            <div className="space-y-4">
              {past.map((apt: Appointment) => <AppointmentCard key={apt.id} appointment={apt} />)}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <p className="text-slate-500">No past visits found.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PatientDashboard;
