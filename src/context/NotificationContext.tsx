import React, { createContext, useCallback, useContext, useState } from "react";

export type NotificationSeverity = "success" | "error" | "info" | "warning";

interface Notification {
  id: number;
  message: string;
  severity: NotificationSeverity;
}

interface NotificationContextValue {
  notify: (options: { message: string; severity?: NotificationSeverity }) => void;
}

const NotificationContext = createContext<NotificationContextValue>({ notify: () => {} });

let nextId = 0;

const severityStyles: Record<NotificationSeverity, { bar: string; icon: string; text: string }> = {
  success: { bar: "bg-emerald-500", icon: "text-emerald-400", text: "text-slate-100" },
  error:   { bar: "bg-red-500",     icon: "text-red-400",     text: "text-slate-100" },
  info:    { bar: "bg-indigo-500",  icon: "text-indigo-400",  text: "text-slate-100" },
  warning: { bar: "bg-amber-500",   icon: "text-amber-400",   text: "text-slate-100" },
};

const severityIcon: Record<NotificationSeverity, React.ReactNode> = {
  success: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const NotificationToast = ({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: number) => void;
}) => {
  const s = severityStyles[notification.severity];
  return (
    <div className="pointer-events-auto flex items-stretch bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/30 overflow-hidden min-w-64 max-w-sm">
      {/* Left color bar */}
      <div className={`w-1 flex-shrink-0 ${s.bar}`} />
      <div className="flex items-center gap-3 px-4 py-3 flex-1">
        <span className={`flex-shrink-0 ${s.icon}`}>{severityIcon[notification.severity]}</span>
        <span className={`text-sm flex-1 ${s.text}`}>{notification.message}</span>
        <button
          onClick={() => onDismiss(notification.id)}
          className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback(({ message, severity = "info" }: { message: string; severity?: NotificationSeverity }) => {
    const id = ++nextId;
    setNotifications((prev) => [...prev, { id, message, severity }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 pointer-events-none">
        {notifications.map((n) => (
          <NotificationToast key={n.id} notification={n} onDismiss={dismiss} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => useContext(NotificationContext);
