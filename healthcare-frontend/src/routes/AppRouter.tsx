import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Spinner } from '../components/ui/Spinner';

// ── Layouts ───────────────────────────────────────────────────────────────
import { PublicLayout } from '../layouts/PublicLayout';
import { PatientLayout } from '../layouts/PatientLayout';
import { DoctorLayout } from '../layouts/DoctorLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────
// Auth
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'));

// Patient
const PatientDashboard = lazy(() => import('../features/patient/PatientDashboard'));
const DoctorSearch = lazy(() => import('../features/patient/DoctorSearch'));
const BookAppointment = lazy(() => import('../features/patient/BookAppointment'));
const PatientAppointments = lazy(() => import('../features/patient/PatientAppointments'));
const PatientAppointmentDetail = lazy(() => import('../features/patient/PatientAppointmentDetail'));

// Doctor
const DoctorDashboard = lazy(() => import('../features/doctor/DoctorDashboard'));
const DoctorAppointments = lazy(() => import('../features/doctor/DoctorAppointments'));
const PostVisitNotes = lazy(() => import('../features/doctor/PostVisitNotes'));

// Admin
const AdminDoctors = lazy(() => import('../features/admin/AdminDoctors'));
const AdminDoctorForm = lazy(() => import('../features/admin/AdminDoctorForm'));
const AdminDoctorDetail = lazy(() => import('../features/admin/AdminDoctorDetail'));
const AdminLeave = lazy(() => import('../features/admin/AdminLeave'));
const AdminNotifications = lazy(() => import('../features/admin/AdminNotifications'));

// Misc
const UnauthorizedPage = lazy(() => import('../features/auth/UnauthorizedPage'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <Spinner size="lg" />
  </div>
);

export const AppRouter: React.FC = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      {/* ── Public ────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* ── Patient ───────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
        <Route element={<PatientLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/search" element={<DoctorSearch />} />
          <Route path="/patient/book/:doctorId" element={<BookAppointment />} />
          <Route path="/patient/appointments" element={<PatientAppointments />} />
          <Route path="/patient/appointments/:id" element={<PatientAppointmentDetail />} />
        </Route>
      </Route>

      {/* ── Doctor ────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
        <Route element={<DoctorLayout />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/appointments/:id/notes" element={<PostVisitNotes />} />
        </Route>
      </Route>

      {/* ── Admin ─────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/doctors" element={<AdminDoctors />} />
          <Route path="/admin/doctors/new" element={<AdminDoctorForm />} />
          <Route path="/admin/doctors/:id" element={<AdminDoctorDetail />} />
          <Route path="/admin/leave" element={<AdminLeave />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
        </Route>
      </Route>

      {/* ── Fallback ──────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Suspense>
);
