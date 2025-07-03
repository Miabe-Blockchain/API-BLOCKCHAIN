"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import Notification from "@/components/Notification";

type NotificationType = "success" | "error" | "info";

interface NotificationState {
  open: boolean;
  type: NotificationType;
  message: string;
}

interface NotificationContextProps {
  showNotification: (opts: { type?: NotificationType; message: string }) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification doit être utilisé dans NotificationProvider");
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notif, setNotif] = useState<NotificationState>({ open: false, type: "info", message: "" });

  const showNotification = useCallback(({ type = "info", message }: { type?: NotificationType; message: string }) => {
    setNotif({ open: true, type, message });
  }, []);

  const handleClose = () => setNotif((n) => ({ ...n, open: false }));

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notif.open && (
        <Notification
          type={notif.type}
          message={notif.message}
          onClose={handleClose}
        />
      )}
    </NotificationContext.Provider>
  );
} 