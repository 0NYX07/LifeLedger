import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ObligationFormModal } from './components/ObligationFormModal';
import { Toast } from './components/Toast';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Obligations } from './pages/Obligations';
import { MoneyOutlook } from './pages/MoneyOutlook';
import { apiClient } from './api/apiClient';

// Route protection component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public route that redirects to dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function MainLayout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObligation, setEditingObligation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerToast = ({ type, message }) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleOpenNewModal = () => {
    setEditingObligation(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (obligation) => {
    setEditingObligation(obligation);
    setModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingObligation) {
        const res = await apiClient.obligations.update(editingObligation._id, formData);
        if (res.success) {
          triggerToast({ type: 'success', message: 'Obligation updated successfully!' });
          setModalOpen(false);
          setRefreshKey((k) => k + 1);
        }
      } else {
        const res = await apiClient.obligations.create(formData);
        if (res.success) {
          triggerToast({ type: 'success', message: 'Obligation created successfully!' });
          setModalOpen(false);
          setRefreshKey((k) => k + 1);
        }
      }
    } catch (err) {
      triggerToast({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar onOpenNewModal={handleOpenNewModal} />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard
                  onOpenNewModal={handleOpenNewModal}
                  onEditObligation={handleOpenEditModal}
                  onTriggerToast={triggerToast}
                  refreshKey={refreshKey}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/obligations"
            element={
              <ProtectedRoute>
                <Obligations
                  onOpenNewModal={handleOpenNewModal}
                  onEditObligation={handleOpenEditModal}
                  onTriggerToast={triggerToast}
                  refreshKey={refreshKey}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/money-outlook"
            element={
              <ProtectedRoute>
                <MoneyOutlook refreshKey={refreshKey} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">LifeLedger</span>
            <span>—</span>
            <span>Personal Life Administration MVP</span>
          </div>
          <div className="text-slate-400">
            Obligation Intelligence • MERN Architecture
          </div>
        </div>
      </footer>

      {/* Global Modals & Notifications */}
      <ObligationFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingObligation}
        isSubmitting={isSubmitting}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
