import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Student pages
import StudentLogin from './pages/student/StudentLogin';
import StudentRegister from './pages/student/StudentRegister';
import StudentDashboard from './pages/student/StudentDashboard';
import NewComplaint from './pages/student/NewComplaint';
import ComplaintDetail from './pages/student/ComplaintDetail';

// Worker pages
import WorkerLogin from './pages/worker/WorkerLogin';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import ComplaintHandler from './pages/worker/ComplaintHandler';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ComplaintManagement from './pages/admin/ComplaintManagement';
import UserManagement from './pages/admin/UserManagement';

function App() {
  const { user } = useAuth();

  return (
    <div className="App">
      {user && <Navbar />}

      <Routes>
        {/* Landing/Login Routes */}
        <Route path="/" element={
          user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Navigate to="/student/login" replace />
        } />

        {/* Student Routes */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/complaints/new" element={
          <ProtectedRoute allowedRoles={['student']}>
            <NewComplaint />
          </ProtectedRoute>
        } />
        <Route path="/student/complaints/:id" element={
          <ProtectedRoute allowedRoles={['student']}>
            <ComplaintDetail />
          </ProtectedRoute>
        } />

        {/* Worker Routes */}
        <Route path="/worker/login" element={<WorkerLogin />} />
        <Route path="/worker/dashboard" element={
          <ProtectedRoute allowedRoles={['worker']}>
            <WorkerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/worker/complaints/:id" element={
          <ProtectedRoute allowedRoles={['worker']}>
            <ComplaintHandler />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/complaints" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ComplaintManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<div className="container mt-4 text-center"><h2>404 - Page Not Found</h2></div>} />
      </Routes>
    </div>
  );
}

export default App;
