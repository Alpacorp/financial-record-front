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

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
});

let nextId = 0;

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback(
    ({
      message,
      severity = "info",
    }: {
      message: string;
      severity?: NotificationSeverity;
    }) => {
      const id = ++nextId;
      setNotifications((prev) => [...prev, { id, message, severity }]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    },
    []
  );

  const dismiss = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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

const severityStyles: Record<NotificationSeverity, string> = {
  success: "bg-green-600 text-white border-green-700",
  error: "bg-red-600 text-white border-red-700",
  info: "bg-blue-600 text-white border-blue-700",
  warning: "bg-yellow-500 text-white border-yellow-600",
};

const severityIcon: Record<NotificationSeverity, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const NotificationToast = ({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: number) => void;
}) => {
  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-64 max-w-sm animate-fade-in ${severityStyles[notification.severity]}`}
    >
      <span className="text-lg font-bold shrink-0">
        {severityIcon[notification.severity]}
      </span>
      <span className="text-sm flex-1">{notification.message}</span>
      <button
        onClick={() => onDismiss(notification.id)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => useContext(NotificationContext);
