import { useState } from 'react';
import { format } from 'date-fns';
import { Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSearchDoctors } from './hooks/usePatientAPI';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import type { Doctor } from '../../types/appointment';

const DoctorCard: React.FC<{ doctor: Doctor }> = ({ doctor }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm transition-all hover:border-indigo-500/50 flex flex-col h-full">
    <div className="flex items-center gap-4 mb-4">
      <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
        <User className="h-6 w-6 text-slate-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">Dr. {doctor.firstName} {doctor.lastName}</h3>
        <p className="text-sm text-indigo-400">{doctor.specialisation}</p>
      </div>
    </div>
    
    <div className="flex-1">
      {doctor.bio && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-3">{doctor.bio}</p>
      )}
      <div className="text-xs text-slate-500 mb-4">
        {doctor.nextAvailableDate ? (
          <span>Next available: <span className="text-slate-300 font-medium">{doctor.nextAvailableDate}</span></span>
        ) : (
          <span>No slots currently published.</span>
        )}
      </div>
    </div>

    <div className="pt-4 border-t border-slate-800 mt-auto">
      <Link to={`/patient/book/${doctor.id}`}>
        <Button className="w-full">Book Appointment</Button>
      </Link>
    </div>
  </div>
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
        <h1 className="text-3xl font-bold text-white mb-2">Find a Doctor</h1>
        <p className="text-slate-400">Search by specialisation or date to find the right care.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Input
              label="Specialisation"
              placeholder="e.g. Cardiologist"
              value={specialisation}
              onChange={(e) => setSpecialisation(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Date (Optional)"
              type="date"
              min={format(new Date(), 'yyyy-MM-dd')}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full md:w-auto h-10 px-6">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner size="lg" /></div>
      ) : doctors?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {doctors.map((doc: Doctor) => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400">No doctors found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;
