import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TeamAuthProvider, useTeamAuth } from './contexts/TeamAuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/Login';
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import ParticipantLogin from './pages/participant/Login';

function ParticipantRoot() {
  const { isAuthenticated } = useTeamAuth();
  return isAuthenticated ? <ParticipantDashboard /> : <ParticipantLogin />;
}

function AdminRoot() {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? <AdminDashboard /> : <AdminLogin />;
}

import { ErrorBoundary } from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={
            <TeamAuthProvider>
              <ParticipantRoot />
            </TeamAuthProvider>
          } />
          <Route path="/admin" element={
            <AdminAuthProvider>
              <AdminRoot />
            </AdminAuthProvider>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
