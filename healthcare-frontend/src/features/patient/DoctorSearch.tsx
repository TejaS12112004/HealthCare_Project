import { useState } from 'react';
import { format } from 'date-fns';
import { Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSearchDoctors } from './hooks/usePatientAPI';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { Reveal, RevealItem } from '../../lib/motion/Reveal';
import type { Doctor } from '../../types/appointment';

const DoctorCard: React.FC<{ doctor: Doctor }> = ({ doctor }) => (
  <Card className="transition-all hover:border-accent/30 hover:-translate-y-1 flex flex-col h-full">
    <div className="flex items-center gap-4 mb-4">
      <div className="h-12 w-12 rounded-xl bg-bg border border-ink/5 flex items-center justify-center flex-shrink-0">
        <User className="h-6 w-6 text-ink/40" />
      </div>
      <div>
        <h3 className="text-lg font-display font-medium text-ink">Dr. {doctor.firstName} {doctor.lastName}</h3>
        <p className="text-sm font-medium text-accent">{doctor.specialisation}</p>
      </div>
    </div>
    
    <div className="flex-1">
      {doctor.bio && (
        <p className="text-sm text-ink/60 mb-4 line-clamp-3">{doctor.bio}</p>
      )}
      <div className="text-xs text-ink/50 mb-4 font-medium">
        {doctor.nextAvailableDate ? (
          <span>Next available: <span className="text-ink font-bold">{doctor.nextAvailableDate}</span></span>
        ) : (
          <span>No slots currently published.</span>
        )}
      </div>
    </div>

    <div className="pt-4 border-t border-ink/5 mt-auto">
      <Link to={`/patient/book/${doctor.id}`}>
        <Button className="w-full">Book Appointment</Button>
      </Link>
    </div>
  </Card>
);

const DoctorSearch: React.FC = () => {
  const [specialisation, setSpecialisation] = useState('');
  const [date, setDate] = useState('');
  
  // Real-time debounced search would be better, but we'll use a simple form submit approach
  const [searchParams, setSearchParams] = useState({ spec: '', date: '' });
  
  const { data: doctors, isLoading } = useSearchDoctors(searchParams.spec, searchParams.date);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ spec: specialisation, date });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Reveal>
          <h1 className="text-3xl text-ink font-display mb-2">Find a Doctor</h1>
          <p className="text-ink/60 font-body">Search by specialisation or date to find the right care.</p>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <Card className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input
                label="Specialisation"
                placeholder="e.g. Cardiologist"
                value={specialisation}
                onChange={(e) => setSpecialisation(e.target.value)}
              />
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
            <Button type="submit" className="w-full md:w-auto h-[42px] px-6">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </Card>
      </Reveal>

      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner size="lg" /></div>
      ) : doctors?.length ? (
        <Reveal stagger={0.04} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {doctors.map((doc: Doctor) => (
            <RevealItem key={doc.id}>
              <DoctorCard doctor={doc} />
            </RevealItem>
          ))}
        </Reveal>
      ) : (
        <Reveal delay={0.2}>
          <Card className="py-16">
            <EmptyState 
              icon={Search} 
              title="No doctors found" 
              description="No doctors found matching your criteria." 
            />
          </Card>
        </Reveal>
      )}
    </div>
  );
};

export default DoctorSearch;
