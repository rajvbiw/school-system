import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { TenantProvider } from './context/TenantContext';
import { AuthProvider } from './context/AuthContext';

// Layout
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import MobileNav from './components/layout/MobileNav';

// Utilities
import RoleGuard from './utils/roleGuard';

// Pages: Shared
import Login from './pages/shared/Login';
import Unauthorized from './pages/shared/Unauthorized';
import ReportCardPrint from './pages/shared/ReportCardPrint';

// Pages: Admin
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import Teachers from './pages/admin/Teachers';
import Classes from './pages/admin/Classes';
import Timetable from './pages/admin/Timetable';
import Exams from './pages/admin/Exams';
import Fees from './pages/admin/Fees';
import Announcements from './pages/admin/Announcements';
import Settings from './pages/admin/Settings';
import AIInsights from './pages/admin/AIInsights';

// Pages: Teacher
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherClasses from './pages/teacher/Classes';
import TeacherAssignments from './pages/teacher/Assignments';
import TeacherResults from './pages/teacher/Results';
import TeacherMessages from './pages/teacher/Messages';

// Pages: Student
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentResults from './pages/student/Results';
import StudentAssignments from './pages/student/Assignments';
import StudentFee from './pages/student/Fee';
import StudentTimetable from './pages/student/Timetable';
import StudentMessages from './pages/student/Messages';

// Pages: Parent
import ParentDashboard from './pages/parent/Dashboard';
import ParentAttendance from './pages/parent/Attendance';
import ParentFee from './pages/parent/Fee';
import ParentResults from './pages/parent/Results';
import ParentMessages from './pages/parent/Messages';

// Shared Layout Wrapper
const PortalLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Responsive navigation layout */}
      <Sidebar />
      <MobileNav />
      
      <div className="flex-1 flex flex-col lg:pl-64 pt-16">
        <Navbar />
        <main className="p-8 flex-1 animate-fade-in pb-20 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TenantProvider>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        
        <Routes>
          {/* Public Routing */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/results/report-card/:student_id/:exam_id" element={<ReportCardPrint />} />

          {/* Fallback to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ADMIN PORTAL */}
          <Route element={<RoleGuard allowedRoles={['admin']} />}>
            <Route element={<PortalLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<Students />} />
              <Route path="/admin/teachers" element={<Teachers />} />
              <Route path="/admin/classes" element={<Classes />} />
              <Route path="/admin/timetable" element={<Timetable />} />
              <Route path="/admin/exams" element={<Exams />} />
              <Route path="/admin/fees" element={<Fees />} />
              <Route path="/admin/announcements" element={<Announcements />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/ai-insights" element={<AIInsights />} />
            </Route>
          </Route>

          {/* TEACHER PORTAL */}
          <Route element={<RoleGuard allowedRoles={['teacher']} />}>
            <Route element={<PortalLayout />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/attendance" element={<TeacherAttendance />} />
              <Route path="/teacher/classes" element={<TeacherClasses />} />
              <Route path="/teacher/assignments" element={<TeacherAssignments />} />
              <Route path="/teacher/results" element={<TeacherResults />} />
              <Route path="/teacher/messages" element={<TeacherMessages />} />
            </Route>
          </Route>

          {/* STUDENT PORTAL */}
          <Route element={<RoleGuard allowedRoles={['student']} />}>
            <Route element={<PortalLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/attendance" element={<StudentAttendance />} />
              <Route path="/student/results" element={<StudentResults />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/fee" element={<StudentFee />} />
              <Route path="/student/timetable" element={<StudentTimetable />} />
              <Route path="/student/messages" element={<StudentMessages />} />
            </Route>
          </Route>

          {/* PARENT PORTAL */}
          <Route element={<RoleGuard allowedRoles={['parent']} />}>
            <Route element={<PortalLayout />}>
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
              <Route path="/parent/attendance" element={<ParentAttendance />} />
              <Route path="/parent/fee" element={<ParentFee />} />
              <Route path="/parent/results" element={<ParentResults />} />
              <Route path="/parent/messages" element={<ParentMessages />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </TenantProvider>
  );
};
export default App;
