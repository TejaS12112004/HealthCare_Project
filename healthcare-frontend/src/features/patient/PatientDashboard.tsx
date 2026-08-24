import { Link } from 'react-router-dom';
import { Calendar, Search, Pill } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePatientAppointments } from './hooks/usePatientAPI';
import { AppointmentCard } from './components/AppointmentCard';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { TiltCard } from '../../lib/motion/TiltCard';
import { Reveal } from '../../lib/motion/Reveal';
import type { Appointment } from '../../types/appointment';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: upcoming, isLoading: loadingUpcoming } = usePatientAppointments('CONFIRMED', 3);
  const { data: past, isLoading: loadingPast } = usePatientAppointments('COMPLETED', 5);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <Reveal>
          <h1 className="text-3xl text-ink font-display mb-2">Welcome back, {user?.firstName}!</h1>
          <p className="text-ink/60 font-body">Here's an overview of your healthcare journey.</p>
        </Reveal>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Reveal delay={0.1}>
          <Link to="/patient/search" className="block h-full">
            <TiltCard className="p-6 h-full bg-surface border border-ink/5 rounded-xl shadow-soft hover:border-accent/30 transition-all flex flex-col justify-center">
              <div className="h-12 w-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-xl text-ink font-display mb-2">Book Appointment</h3>
              <p className="text-sm text-ink/60 font-body">Find doctors and schedule visits</p>
            </TiltCard>
          </Link>
        </Reveal>

        <Reveal delay={0.2}>
          <Link to="/patient/appointments" className="block h-full">
            <TiltCard className="p-6 h-full bg-surface border border-ink/5 rounded-xl shadow-soft hover:border-accent/30 transition-all flex flex-col justify-center">
              <div className="h-12 w-12 rounded-lg bg-ink/5 text-ink flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl text-ink font-display mb-2">My Appointments</h3>
              <p className="text-sm text-ink/60 font-body">View upcoming and past visits</p>
            </TiltCard>
          </Link>
        </Reveal>

        <Reveal delay={0.3}>
          <Link to="/patient/appointments" className="block h-full">
            <TiltCard className="p-6 h-full bg-surface border border-ink/5 rounded-xl shadow-soft hover:border-accent/30 transition-all flex flex-col justify-center">
              <div className="h-12 w-12 rounded-lg bg-ink/5 text-ink flex items-center justify-center mb-4">
                <Pill className="h-6 w-6" />
              </div>
              <h3 className="text-xl text-ink font-display mb-2">Prescriptions</h3>
              <p className="text-sm text-ink/60 font-body">Check active medications</p>
            </TiltCard>
          </Link>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming */}
        <Reveal delay={0.4}>
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl text-ink font-display">Upcoming Visits</h2>
              <Link to="/patient/appointments" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">View all</Link>
            </div>
            {loadingUpcoming ? (
              <div className="flex justify-center p-8"><Spinner /></div>
            ) : upcoming?.length ? (
              <div className="space-y-4">
                {upcoming.map((apt: Appointment) => <AppointmentCard key={apt.id} appointment={apt} />)}
              </div>
            ) : (
              <Card className="text-center h-full flex flex-col items-center justify-center">
                <EmptyState 
                  icon={Calendar}
                  title="No upcoming visits"
                  description="No upcoming appointments scheduled."
                  action={
                    <Link to="/patient/search">
                      <Button variant="primary">Find a Doctor</Button>
                    </Link>
                  }
                />
              </Card>
            )}
          </section>
        </Reveal>

        {/* Past */}
        <Reveal delay={0.5}>
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl text-ink font-display">Recent Past Visits</h2>
              <Link to="/patient/appointments" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">View all</Link>
            </div>
            {loadingPast ? (
              <div className="flex justify-center p-8"><Spinner /></div>
            ) : past?.length ? (
              <div className="space-y-4">
                {past.map((apt: Appointment) => <AppointmentCard key={apt.id} appointment={apt} />)}
              </div>
            ) : (
              <Card className="text-center h-full flex flex-col items-center justify-center py-12">
                <EmptyState 
                  icon={Calendar}
                  title="No past visits"
                  description="No past visits found."
                />
              </Card>
            )}
          </section>
        </Reveal>
      </div>
    </div>
  );
};

export default PatientDashboard;
