import { useState } from 'react';
import { Edit2, Plus, PowerOff, UserX } from 'lucide-react';
import { useAdminDoctors, useCreateDoctor, useUpdateDoctor, useDeactivateDoctor, useActivateDoctor } from './hooks/useAdminAPI';
import { AdminDoctorForm } from './AdminDoctorForm';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import type { Doctor } from '../../types/appointment';

export const AdminDoctors: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const { data: doctors, isLoading } = useAdminDoctors();
  const { mutateAsync: createDoctor, isPending: isCreating } = useCreateDoctor();
  const { mutateAsync: updateDoctor, isPending: isUpdating } = useUpdateDoctor();
  const { mutateAsync: deactivateDoctor } = useDeactivateDoctor();
  const { mutateAsync: activateDoctor } = useActivateDoctor();

  const handleOpenModal = (doctor?: Doctor) => {
    setEditingDoctor(doctor || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoctor(null);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingDoctor) {
        await updateDoctor({ id: editingDoctor.id, ...data });
        handleCloseModal();
      } else {
        const response = await createDoctor(data);
        handleCloseModal();
        if (response?.tempPassword) {
          alert(`Doctor created successfully!\n\nTemporary Password: ${response.tempPassword}\n\nPlease share this password with the doctor. They should change it upon first login.`);
        } else {
          alert('Doctor created successfully!');
        }
      }
    } catch (e) {
      alert('Failed to save doctor.');
    }
  };

  const handleToggleActive = async (doctor: Doctor) => {
    if (doctor.isActive) {
      if (confirm(`Are you sure you want to deactivate Dr. ${doctor.lastName}?`)) {
        try {
          await deactivateDoctor(doctor.id);
        } catch (e) {
          alert('Failed to deactivate doctor.');
        }
      }
    } else {
      if (confirm(`Are you sure you want to activate Dr. ${doctor.lastName}?`)) {
        try {
          await activateDoctor(doctor.userId);
        } catch (e) {
          alert('Failed to activate doctor.');
        }
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Doctors</h1>
          <p className="text-slate-400 text-sm">Add, update, or deactivate doctors in the system.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Doctor Name</th>
                  <th className="px-6 py-4 font-semibold">Specialisation</th>
                  <th className="px-6 py-4 font-semibold">Slot Info</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {doctors?.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">Dr. {doc.firstName} {doc.lastName}</div>
                      <div className="text-xs text-slate-500">{doc.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{doc.specialisation}</td>
                    <td className="px-6 py-4">
                      <div>{doc.slotDurationMinutes} min/slot</div>
                      <div className="text-xs text-slate-500">{doc.workingHours?.length || 0} working days</div>
                    </td>
                    <td className="px-6 py-4">
                      {doc.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(doc)}
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded transition-colors"
                          title="Edit Doctor"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {doc.isActive ? (
                          <button 
                            onClick={() => handleToggleActive(doc)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Deactivate Doctor"
                          >
                            <PowerOff className="h-4 w-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggleActive(doc)}
                            className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-400/10 rounded transition-colors"
                            title="Activate Doctor"
                          >
                            <PowerOff className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {doctors?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No doctors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingDoctor ? "Edit Doctor" : "Add New Doctor"}>
        <AdminDoctorForm 
          initialData={editingDoctor} 
          onSubmit={handleSubmit} 
          isSubmitting={isCreating || isUpdating} 
        />
      </Modal>
    </div>
  );
};

export default AdminDoctors;
