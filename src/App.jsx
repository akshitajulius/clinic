import { useState } from 'react';
import { NotificationProvider } from './context/NotificationContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin_pages/DashboardPage';
import QueueManagementPage from './pages/admin_pages/QueueManagementPage';
import './index.css';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'queue':
        return <QueueManagementPage onBack={() => setCurrentPage('dashboard')} />;
      default:
        return <DashboardPage onNavigateQueue={() => setCurrentPage('queue')} />;
    }
  };

  return (
    <NotificationProvider>
      {loggedIn ? renderPage() : (
        <LoginPage onLogin={() => setLoggedIn(true)} />
      )}
    </NotificationProvider>
  );
}
