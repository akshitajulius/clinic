import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'update', message: 'You are now #3 in the General Checkup queue.', time: '2 min ago', read: false },
  { id: 2, type: 'alert', message: 'Your turn is approaching — please head to the front desk.', time: '8 min ago', read: false },
  { id: 3, type: 'info', message: 'You joined the Vaccination queue successfully.', time: '25 min ago', read: true },
  { id: 4, type: 'update', message: 'Queue status changed: General Checkup is now open.', time: '1 hr ago', read: true },
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const addNotification = useCallback((message, type = 'info') => {
    const newNote = {
      id: Date.now(),
      type,
      message,
      time: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNote, ...prev]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
