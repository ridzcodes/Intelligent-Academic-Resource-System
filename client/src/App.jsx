import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Protection Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Student Pages
import BrowseResourcesPage from './pages/student/BrowseResourcesPage';
import SearchPage from './pages/student/SearchPage';
import ResourceDetailsPage from './pages/student/ResourceDetailsPage';
import DashboardPage from './pages/student/DashboardPage';
import UploadResourcePage from './pages/student/UploadResourcePage';
import MyResourcesPage from './pages/student/MyResourcesPage';
import RecommendationsPage from './pages/student/RecommendationsPage';
import ProfilePage from './pages/student/ProfilePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageResourcesPage from './pages/admin/ManageResourcesPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Website Routes (Wrapped with MainLayout Navbar & Footer) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowseResourcesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/resources/:id" element={<ResourceDetailsPage />} />
          </Route>

          {/* Authentication Routes (Wrapped with AuthLayout) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Student Portal Routes (Wrapped with DashboardLayout + ProtectedRoute) */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadResourcePage />} />
            <Route path="/my-resources" element={<MyResourcesPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin Exclusive Routes */}
            <Route
              path="/admin"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/resources"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <ManageResourcesPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <ManageUsersPage />
                </RoleRoute>
              }
            />
          </Route>

          {/* 404 Fallback */}
          <Route element={<MainLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
