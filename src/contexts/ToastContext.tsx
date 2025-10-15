import React, { createContext, useContext, useState } from "react";
import Toast, { ToastType } from "../components/Toast";

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    visible: boolean;
    duration: number;
  }>({
    message: "",
    type: "info",
    visible: false,
    duration: 3000,
  });

  const showToast = (
    message: string,
    type: ToastType = "info",
    duration = 3000
  ) => {
    setToast({ message, type, visible: true, duration });
  };

  const success = (message: string, duration = 3000) => {
    showToast(message, "success", duration);
  };

  const error = (message: string, duration = 3000) => {
    showToast(message, "error", duration);
  };

  const warning = (message: string, duration = 3000) => {
    showToast(message, "warning", duration);
  };

  const info = (message: string, duration = 3000) => {
    showToast(message, "info", duration);
  };

  const handleDismiss = () => {
    setToast({ ...toast, visible: false });
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={handleDismiss}
        duration={toast.duration}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
