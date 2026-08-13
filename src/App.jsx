import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin_pages/DashboardPage';
import UserDashboard from './pages/UserDashboard';
import JoinQueuePage from './pages/JoinQueuePage';
import QueueStatusPage from './pages/QueueStatusPage';
import UserHistoryPage from './pages/UserHistoryPage';
import './index.css';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (role) => {
    setUserRole(role);
    setLoggedIn(true);
  };

  return (
    <NotificationProvider>
      <Router>
        {loggedIn ? (
          <Routes>
            {/* Admin Route — redirect patients away */}
            <Route path="/admin" element={userRole === 'admin' ? <DashboardPage /> : <Navigate to="/dashboard" replace />} />
            
            {/* Patient Routes — redirect admins away */}
            <Route path="/dashboard" element={userRole !== 'admin' ? <UserDashboard /> : <Navigate to="/admin" replace />} />
            <Route path="/join" element={userRole !== 'admin' ? <JoinQueuePage /> : <Navigate to="/admin" replace />} />
            <Route path="/status" element={userRole !== 'admin' ? <QueueStatusPage /> : <Navigate to="/admin" replace />} />
            <Route path="/history" element={userRole !== 'admin' ? <UserHistoryPage /> : <Navigate to="/admin" replace />} />
            
            {/* Fallback: redirect based on role */}
            <Route path="*" element={<Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />} />
          </Routes>
        ) : (
          <LoginPage onLogin={handleLogin} />
        )}
      </Router>
    </NotificationProvider>
  );
}