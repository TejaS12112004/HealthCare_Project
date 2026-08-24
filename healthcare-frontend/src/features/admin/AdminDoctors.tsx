import { useState } from 'react';
import { Edit2, Plus, PowerOff } from 'lucide-react';
import { useAdminDoctors, useCreateDoctor, useUpdateDoctor, useDeactivateDoctor, useActivateDoctor } from './hooks/useAdminAPI';
import { AdminDoctorForm } from './AdminDoctorForm';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Reveal } from '../../lib/motion/Reveal';
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
    <div className="space-y-8 max-w-7xl mx-auto p-8">
      <Reveal className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-ink font-display mb-2">Manage Doctors</h1>
          <p className="text-ink/60 font-body">Add, update, or deactivate doctors in the system.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-5 w-5 mr-2" />
          Add Doctor
        </Button>
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12"><Spinner size="lg" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink">
                <thead className="bg-bg text-xs uppercase text-ink/50 font-bold border-b border-ink/5 tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Doctor Name</th>
                    <th className="px-6 py-4 font-bold">Specialisation</th>
                    <th className="px-6 py-4 font-bold">Slot Info</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 bg-surface">
                  {doctors?.map(doc => (
                    <tr key={doc.id} className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-ink">Dr. {doc.firstName} {doc.lastName}</div>
                        <div className="text-xs text-ink/50 font-medium">{doc.email}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{doc.specialisation}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{doc.slotDurationMinutes} min/slot</div>
                        <div className="text-xs text-ink/50 font-medium">{doc.workingHours?.length || 0} working days</div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(doc)}
                            className="p-2 text-ink/40 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            title="Edit Doctor"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {doc.isActive ? (
                            <button 
                              onClick={() => handleToggleActive(doc)}
                              className="p-2 text-ink/40 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                              title="Deactivate Doctor"
                            >
                              <PowerOff className="h-4 w-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleToggleActive(doc)}
                              className="p-2 text-ink/40 hover:text-success hover:bg-success/10 rounded-lg transition-colors"
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
                      <td colSpan={5} className="px-6 py-12 text-center text-ink/50 font-medium">
                        No doctors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Reveal>

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
