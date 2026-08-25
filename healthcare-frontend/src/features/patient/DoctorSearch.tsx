import React, { useState } from 'react';
import { format } from 'date-fns';
import { Search, User, Stethoscope, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSearchDoctors } from './hooks/usePatientAPI';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Reveal, RevealItem } from '../../lib/motion/Reveal';
import type { Doctor } from '../../types/appointment';

/* ─── Doctor card with hover-lift (no 3D tilt) ──────────────────────── */
const DoctorCard: React.FC<{ doctor: Doctor }> = ({ doctor }) => (
  <Card className="flex flex-col h-full hover:-translate-y-1 hover:border-accent/30 hover:shadow-soft transition-all duration-150">
    {/* Avatar + name header */}
    <div className="flex items-center gap-4 mb-4">
      <div className="h-14 w-14 rounded-xl bg-bg border border-ink/5 flex items-center justify-center flex-shrink-0">
        <User className="h-7 w-7 text-ink/30" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-display font-semibold text-ink leading-tight truncate">
          Dr. {doctor.firstName} {doctor.lastName}
        </h3>
        <p className="text-xs font-medium text-accent mt-0.5 truncate">{doctor.specialisation}</p>
      </div>
    </div>

    {/* Bio */}
    {doctor.bio && (
      <p className="text-sm text-ink/60 font-body leading-relaxed line-clamp-3 mb-4 flex-1">
        {doctor.bio}
      </p>
    )}
    {!doctor.bio && <div className="flex-1" />}

    {/* Availability chip */}
    <div className="flex items-center gap-2 mb-4 py-2.5 px-3 rounded-lg bg-bg border border-ink/5">
      <Clock className="h-3.5 w-3.5 text-ink/40 flex-shrink-0" />
      <span className="text-xs font-body text-ink/60">
        {doctor.nextAvailableDate ? (
          <>Next available: <span className="font-semibold text-ink">{doctor.nextAvailableDate}</span></>
        ) : (
          <span className="text-ink/40 italic">No slots currently published</span>
        )}
      </span>
    </div>

    {/* CTA */}
    <div className="pt-3 border-t border-ink/5">
      <Link to={`/patient/book/${doctor.id}`}>
        <Button variant="primary" size="sm" className="w-full">
          Book Appointment
        </Button>
      </Link>
    </div>
  </Card>
);

const DoctorSearch: React.FC = () => {
  const [specialisation, setSpecialisation] = useState('');
  const [date, setDate] = useState('');
  const [searchParams, setSearchParams] = useState({ spec: '', date: '' });

  const { data: doctors, isLoading } = useSearchDoctors(searchParams.spec, searchParams.date);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ spec: specialisation, date });
  };

  const hasResults = !!doctors?.length;
  const hasSearched = searchParams.spec !== '' || searchParams.date !== '';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <Reveal>
        <header className="mb-8">
          <h1 className="text-3xl font-display font-semibold text-ink mb-1">Find a Doctor</h1>
          <p className="text-ink/50 font-body text-sm">Search by specialisation or date to find the right care.</p>
        </header>
      </Reveal>

      {/* Search Card */}
      <Reveal delay={0.05}>
        <Card className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-ink/60 mb-1.5 font-body">Specialisation</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30 pointer-events-none" />
                <input
                  type="text"
                  className="w-full h-10 pl-9 pr-3 text-sm font-body rounded-lg bg-bg border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                  placeholder="e.g. Cardiologist, Dermatologist…"
                  value={specialisation}
                  onChange={(e) => setSpecialisation(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 w-full">
              <Input
                label="Date (Optional)"
                type="date"
                min={format(new Date(), 'yyyy-MM-dd')}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" className="w-full md:w-auto h-10 px-6 flex-shrink-0">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </Card>
      </Reveal>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : hasResults ? (
        <Reveal stagger={0.04} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {doctors!.map((doc: Doctor) => (
            <RevealItem key={doc.id}>
              <DoctorCard doctor={doc} />
            </RevealItem>
          ))}
        </Reveal>
      ) : hasSearched ? (
        <Reveal delay={0.1}>
          <Card className="py-16">
            <EmptyState
              icon={Search}
              title="No doctors found"
              description="No doctors match your search criteria. Try a different specialisation or date."
            />
          </Card>
        </Reveal>
      ) : (
        <Reveal delay={0.1}>
          <Card className="py-16">
            <EmptyState
              icon={Stethoscope}
              title="Search for a specialist"
              description="Enter a specialisation or choose a date above to find available doctors."
            />
          </Card>
        </Reveal>
      )}
    </div>
  );
};

export default DoctorSearch;
