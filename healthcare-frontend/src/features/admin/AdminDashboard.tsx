import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Users, Stethoscope, Calendar, Mail, BrainCircuit, Activity, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminDoctors, useEmailLogs, useFailedLLMSummaries } from './hooks/useAdminAPI';
import { useDoctorAppointments } from '../doctor/hooks/useDoctorAPI';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Reveal } from '../../lib/motion/Reveal';

/* ── Count-up (fires once on mount) ──────────────────────────────── */
function useCountUp(target: number, ms = 900) {
  const [val, setVal] = useState(0);
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (target === 0) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, ms]);
  return val;
}

/* ── Stat card ────────────────────────────────────────────────────── */
const StatCard: React.FC<{
  label: string;
  rawValue: number;
  icon: React.ReactNode;
  iconBg: string;
  to?: string;
  sublabel?: string;
}> = ({ label, rawValue, icon, iconBg, to, sublabel }) => {
  const count = useCountUp(rawValue);
  const Inner = (
    <Card className="flex items-center gap-5 hover:border-accent/20 transition-colors group h-full">
      <div className={`h-13 w-13 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`} style={{ height: '3.25rem', width: '3.25rem' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-0.5">{label}</p>
        <p className="text-3xl font-display font-bold text-ink leading-none">{count}</p>
        {sublabel && <p className="text-xs text-ink/40 font-body mt-1">{sublabel}</p>}
      </div>
      {to && <TrendingUp className="h-4 w-4 text-ink/15 group-hover:text-accent transition-colors flex-shrink-0" />}
    </Card>
  );
  if (to) return <Link to={to} className="block h-full">{Inner}</Link>;
  return Inner;
};

/* ── Quick-link card ──────────────────────────────────────────────── */
const QuickLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  badge?: React.ReactNode;
}> = ({ to, icon, label, sublabel, badge }) => (
  <Link to={to} className="group">
    <div className="flex items-center gap-3 p-4 rounded-xl border border-ink/5 bg-surface hover:border-accent/20 hover:bg-accent/5 transition-all duration-150">
      <div className="h-9 w-9 rounded-lg bg-bg border border-ink/5 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink/50 font-body">{sublabel}</p>
      </div>
      {badge}
    </div>
  </Link>
);

const AdminDashboard: React.FC = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: doctors } = useAdminDoctors();
  const { data: todayAppts } = useDoctorAppointments(today);
  const { data: emailLogs } = useEmailLogs();
  const { data: failedLLM } = useFailedLLMSummaries();

  const activeDoctors = doctors?.filter(d => d.isActive) ?? [];
  const pendingEmails = emailLogs?.filter((e: any) => e.status === 'PENDING' || e.status === 'FAILED') ?? [];
  const totalDoctors = doctors?.length ?? 0;
  const totalToday = todayAppts?.length ?? 0;
  const failedCount = failedLLM?.length ?? 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <Reveal>
        <header>
          <p className="text-xs font-medium text-ink/40 font-body mb-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
          <h1 className="text-3xl font-display font-semibold text-ink">Admin Overview</h1>
          <p className="text-ink/50 font-body text-sm mt-1">System health, activity, and management shortcuts.</p>
        </header>
      </Reveal>

      {/* Stats row — landing-page treatment */}
      <Reveal delay={0.08}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Doctors"
            rawValue={activeDoctors.length}
            icon={<Stethoscope className="h-5 w-5 text-accent" />}
            iconBg="bg-accent/10"
            to="/admin/doctors"
            sublabel={`of ${totalDoctors} total`}
          />
          <StatCard
            label="Today's Appointments"
            rawValue={totalToday}
            icon={<Calendar className="h-5 w-5 text-sky-500" />}
            iconBg="bg-sky-500/10"
            sublabel={format(new Date(), 'MMM d')}
          />
          <StatCard
            label="Email Alerts"
            rawValue={pendingEmails.length}
            icon={<Mail className="h-5 w-5 text-warning" />}
            iconBg="bg-warning/10"
            to="/admin/notifications"
            sublabel="pending / failed"
          />
          <StatCard
            label="Failed LLM Jobs"
            rawValue={failedCount}
            icon={<BrainCircuit className="h-5 w-5 text-danger" />}
            iconBg="bg-danger/10"
            to="/admin/llm-monitor"
            sublabel="need retry"
          />
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <Reveal delay={0.12} className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-display font-semibold text-ink/70 uppercase tracking-wider">Management</h2>
          <QuickLink
            to="/admin/doctors"
            icon={<Users className="h-4 w-4 text-accent" />}
            label="Doctor Management"
            sublabel="Add, edit or deactivate doctors"
            badge={
              <Badge variant="accent" className="text-[10px]">{totalDoctors}</Badge>
            }
          />
          <QuickLink
            to="/admin/leave"
            icon={<Calendar className="h-4 w-4 text-ink/50" />}
            label="Leave Management"
            sublabel="Schedule doctor absences"
          />
          <QuickLink
            to="/admin/notifications"
            icon={<Mail className="h-4 w-4 text-warning" />}
            label="Email Notifications"
            sublabel="Monitor delivery logs"
            badge={
              pendingEmails.length > 0
                ? <Badge variant="warning" className="text-[10px]">{pendingEmails.length}</Badge>
                : <Badge variant="success" className="text-[10px]">OK</Badge>
            }
          />
          <QuickLink
            to="/admin/llm-monitor"
            icon={<BrainCircuit className="h-4 w-4 text-danger" />}
            label="LLM Monitor"
            sublabel="Retry failed AI summaries"
            badge={
              failedCount > 0
                ? <Badge variant="danger" className="text-[10px]">{failedCount}</Badge>
                : <Badge variant="success" className="text-[10px]">Healthy</Badge>
            }
          />
        </Reveal>

        {/* Today's doctor schedule snapshot */}
        <Reveal delay={0.16} className="lg:col-span-2">
          <Card noPadding>
            <div className="px-6 py-4 border-b border-ink/5 flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-ink flex items-center gap-2">
                <Activity className="h-4 w-4 text-ink/40" />
                Doctor Roster
              </h2>
              <span className="text-xs text-ink/40 font-body">{activeDoctors.length} active</span>
            </div>
            <div className="divide-y divide-ink/5 max-h-80 overflow-y-auto">
              {activeDoctors.slice(0, 8).map(doc => (
                <div key={doc.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-accent">
                      {doc.firstName?.[0]}{doc.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold text-ink truncate">
                      Dr. {doc.firstName} {doc.lastName}
                    </p>
                    <p className="text-xs text-ink/50 font-body truncate">{doc.specialisation}</p>
                  </div>
                  <Badge variant="success" className="text-[10px] flex-shrink-0">Active</Badge>
                </div>
              ))}
              {activeDoctors.length === 0 && (
                <div className="py-10 text-center text-ink/40 text-sm font-body">
                  No active doctors found.
                </div>
              )}
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
};

export default AdminDashboard;
