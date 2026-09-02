import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import CanAccess from './components/rbac/CanAccess';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './components/pages/Login';
import Unauthorized from './components/pages/Unauthorized';

// Admin pages
import AdminDashboard from './components/pages/admin/Dashboard';
import AdminStudents from './components/pages/admin/Students';
import AdminSchedule from './components/pages/admin/Schedule';
import AdminAttendance from './components/pages/admin/Attendance';
import AdminReports from './components/pages/admin/Reports';
import BatchDetail from './components/pages/admin/BatchDetail';
import Verification from './components/pages/admin/Verification';
import Payroll from './components/pages/admin/Payroll';
import CourtMaster from './components/pages/admin/CourtMaster';
import RevenueReport from './components/pages/admin/RevenueReport';

// Coach pages
import CoachDashboard from './components/pages/coach/Dashboard';
import CoachToday from './components/pages/coach/CoachToday';
import PrivateLog from './components/pages/coach/PrivateLog';
import CoachAttendance from './components/pages/coach/Attendance';
import CoachLeave from './components/pages/coach/Leave';
import CoachStats from './components/pages/coach/MyStats';

// Parent pages
import ParentDashboard from './components/pages/parent/Dashboard';
import ParentSchedule from './components/pages/parent/Schedule';
import ParentAttendance from './components/pages/parent/Attendance';
import ParentPayments from './components/pages/parent/Payments';
import ParentPackage from './components/pages/parent/Package';
import ParentProgress from './components/pages/parent/Progress';

import ErrorBoundary from './components/ui/ErrorBoundary';

function PuchoBadge() {
  const { pathname } = useLocation();
  if (pathname === '/login') return null;
  return (
    <div className="fixed bottom-0 right-0 z-[50] pointer-events-none select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)', paddingRight: 'calc(env(safe-area-inset-right, 0px) + 14px)' }}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-xl rounded-full shadow-[0_4px_20px_rgba(139,92,246,0.08)] border border-white/50">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Powered By</span>
        <img src="https://cdn.prod.website-files.com/690ec911550adb97c4a56495/69399fa4c6253325791cd9ce_pucho%20logo.webp" alt="Pucho.ai" className="h-3.5 w-auto object-contain" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/admin" element={<CanAccess role="admin"><DashboardLayout /></CanAccess>}>
            <Route index element={<AdminDashboard />} />
            <Route path="schedule" element={<ErrorBoundary><AdminSchedule /></ErrorBoundary>} />
            <Route path="batches/:batchId" element={<ErrorBoundary><BatchDetail /></ErrorBoundary>} />
            <Route path="students" element={<ErrorBoundary><AdminStudents /></ErrorBoundary>} />
            <Route path="attendance" element={<ErrorBoundary><AdminAttendance /></ErrorBoundary>} />
            <Route path="verification" element={<Verification />} />
            <Route path="reports" element={<ErrorBoundary><AdminReports /></ErrorBoundary>} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="courts" element={<ErrorBoundary><CourtMaster /></ErrorBoundary>} />
            <Route path="revenue" element={<ErrorBoundary><RevenueReport /></ErrorBoundary>} />
          </Route>

          <Route path="/ops" element={<CanAccess role="ops_head"><DashboardLayout /></CanAccess>}>
            <Route index element={<AdminDashboard />} />
            <Route path="schedule" element={<ErrorBoundary><AdminSchedule /></ErrorBoundary>} />
            <Route path="students" element={<ErrorBoundary><AdminStudents /></ErrorBoundary>} />
            <Route path="attendance" element={<ErrorBoundary><AdminAttendance /></ErrorBoundary>} />
            <Route path="verification" element={<Verification />} />
            <Route path="reports" element={<ErrorBoundary><AdminReports /></ErrorBoundary>} />
          </Route>

          <Route path="/coach" element={<CanAccess role="coach"><DashboardLayout /></CanAccess>}>
            <Route index element={<CoachToday />} />
            <Route path="dashboard" element={<CoachDashboard />} />
            <Route path="private-log" element={<PrivateLog />} />
            <Route path="attendance" element={<CoachAttendance />} />
            <Route path="leave" element={<CoachLeave />} />
            <Route path="stats" element={<CoachStats />} />
          </Route>

          <Route path="/parent" element={<CanAccess role="parent"><DashboardLayout /></CanAccess>}>
            <Route index element={<ParentDashboard />} />
            <Route path="schedule" element={<ParentSchedule />} />
            <Route path="attendance" element={<ParentAttendance />} />
            <Route path="payments" element={<ParentPayments />} />
            <Route path="package" element={<ParentPackage />} />
            <Route path="progress" element={<ParentProgress />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <PuchoBadge />
      </AuthProvider>
    </BrowserRouter>
  );
}