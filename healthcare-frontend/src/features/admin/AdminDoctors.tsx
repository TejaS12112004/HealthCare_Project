import React, { useState } from 'react';
import { Edit2, Plus, PowerOff, Search, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminDoctors, useCreateDoctor, useUpdateDoctor, useDeactivateDoctor, useActivateDoctor } from './hooks/useAdminAPI';
import { AdminDoctorForm } from './AdminDoctorForm';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Reveal } from '../../lib/motion/Reveal';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../lib/utils';
import type { Doctor } from '../../types/appointment';

const PAGE_SIZE = 10;

export const AdminDoctors: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [confirmToggle, setConfirmToggle] = useState<Doctor | null>(null);

  const { data: doctors, isLoading } = useAdminDoctors();
  const { mutateAsync: createDoctor, isPending: isCreating } = useCreateDoctor();
  const { mutateAsync: updateDoctor, isPending: isUpdating } = useUpdateDoctor();
  const { mutateAsync: deactivateDoctor, isPending: isDeactivating } = useDeactivateDoctor();
  const { mutateAsync: activateDoctor, isPending: isActivating } = useActivateDoctor();
  const { toast } = useToast();

  /* ── Filtering + pagination ── */
  const filtered = (doctors ?? []).filter(d => {
    const q = search.toLowerCase();
    return (
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.specialisation?.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleOpenModal = (doctor?: Doctor) => {
    setEditingDoctor(doctor ?? null);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingDoctor(null); };

  const handleSubmit = async (data: any) => {
    try {
      if (editingDoctor) {
        await updateDoctor({ id: editingDoctor.id, ...data });
        toast('Doctor updated successfully.', 'success');
        handleCloseModal();
      } else {
        const res = await createDoctor(data);
        handleCloseModal();
        if (res?.tempPassword) {
          toast(`Doctor created! Temp password: ${res.tempPassword}`, 'success');
        } else {
          toast('Doctor created successfully.', 'success');
        }
      }
    } catch {
      toast('Failed to save doctor.', 'error');
    }
  };

  const handleConfirmToggle = async () => {
    if (!confirmToggle) return;
    try {
      if (confirmToggle.isActive) {
        await deactivateDoctor(confirmToggle.id);
        toast(`Dr. ${confirmToggle.lastName} deactivated.`, 'success');
      } else {
        await activateDoctor(confirmToggle.userId);
        toast(`Dr. ${confirmToggle.lastName} activated.`, 'success');
      }
      setConfirmToggle(null);
    } catch {
      toast('Action failed. Please try again.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 md:p-8">
      {/* Header */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-semibold text-ink mb-1">Manage Doctors</h1>
            <p className="text-ink/50 font-body text-sm">Add, update, or deactivate doctors in the system.</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="flex-shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Doctor
          </Button>
        </div>
      </Reveal>

      {/* Search */}
      <Reveal delay={0.05}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, specialisation…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 h-10 text-sm font-body rounded-lg bg-surface border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
          />
        </div>
      </Reveal>

      {/* Table */}
      <Reveal delay={0.08}>
        <Card noPadding>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : paged.length === 0 ? (
            <div className="py-16">
              <EmptyState icon={Users} title="No doctors found" description={search ? 'Try adjusting your search.' : 'No doctors have been added yet.'} />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Doctor</TableHead>
                    <TableHead>Specialisation</TableHead>
                    <TableHead className="hidden md:table-cell">Slot Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence initial={false}>
                    {paged.map((doc) => (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          'border-b border-ink/5 last:border-0 transition-colors hover:bg-bg',
                          !doc.isActive && 'opacity-60'
                        )}
                      >
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-accent">
                                {doc.firstName?.[0]}{doc.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-display font-semibold text-ink">
                                Dr. {doc.firstName} {doc.lastName}
                              </p>
                              <p className="text-xs text-ink/40 font-body">{doc.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-ink/70 font-medium">{doc.specialisation}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-sm font-medium text-ink">{doc.slotDurationMinutes}m/slot</p>
                          <p className="text-xs text-ink/40">{doc.workingHours?.length ?? 0} working days</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={doc.isActive ? 'success' : 'danger'}>
                            {doc.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenModal(doc)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-ink/40 hover:text-accent hover:bg-accent/10 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmToggle(doc)}
                              className={cn(
                                'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                                doc.isActive
                                  ? 'text-ink/40 hover:text-danger hover:bg-danger/10'
                                  : 'text-ink/40 hover:text-success hover:bg-success/10'
                              )}
                              title={doc.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <PowerOff className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>

              {/* Pagination footer */}
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      </Reveal>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}>
        <AdminDoctorForm
          initialData={editingDoctor}
          onSubmit={handleSubmit}
          isSubmitting={isCreating || isUpdating}
        />
      </Modal>

      {/* Activate / Deactivate confirmation Modal */}
      <Modal
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        title={confirmToggle?.isActive ? 'Deactivate Doctor' : 'Activate Doctor'}
      >
        <p className="text-ink/60 font-body mb-6 leading-relaxed">
          {confirmToggle?.isActive
            ? `Are you sure you want to deactivate Dr. ${confirmToggle?.lastName}? They will no longer be able to log in or receive new appointments.`
            : `Activate Dr. ${confirmToggle?.lastName}? They will be able to log in and accept appointments again.`}
        </p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmToggle(null)}>
            Cancel
          </Button>
          <Button
            variant={confirmToggle?.isActive ? 'destructive' : 'primary'}
            isLoading={isDeactivating || isActivating}
            onClick={handleConfirmToggle}
          >
            {confirmToggle?.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDoctors;
