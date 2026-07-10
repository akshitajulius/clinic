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

  return (
    <NotificationProvider>
      <Router>
        {loggedIn ? (
          <Routes>
            {/* Admin Route */}
            <Route path="/admin" element={<DashboardPage />} />
            
            {/* Patient Routes */}
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/join" element={<JoinQueuePage />} />
            <Route path="/status" element={<QueueStatusPage />} />
            <Route path="/history" element={<UserHistoryPage />} />
            
            {/* Fallback: if they go to a weird URL, send them to the dashboard. just in case */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        ) : (
          <LoginPage onLogin={() => setLoggedIn(true)} />
        )}
      </Router>
    </NotificationProvider>
  );
}