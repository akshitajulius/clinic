import { useState } from 'react';
import { NotificationProvider } from './context/NotificationContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin_pages/DashboardPage';
import './index.css';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <NotificationProvider>
      {loggedIn ? (
        <DashboardPage />
      ) : (
        <LoginPage onLogin={() => setLoggedIn(true)} />
      )}
    </NotificationProvider>
  );
}
