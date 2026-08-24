import { useParams } from 'react-router-dom';
const AdminDoctorDetail: React.FC = () => {
  const { id } = useParams();
  return <div className="p-8"><h1 className="text-2xl font-bold text-white mb-6">Doctor Details: {id}</h1></div>;
};
export default AdminDoctorDetail;
