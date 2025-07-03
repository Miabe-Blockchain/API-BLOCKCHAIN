"use client";

import React, { useEffect } from "react";

type NotificationProps = {
  type?: "success" | "error" | "info" | "warning";
  message: string;
  onClose?: () => void;
  duration?: number; // ms
};

export default function Notification({ type = "info", message, onClose, duration = 3500 }: NotificationProps) {
  useEffect(() => {
    if (!onClose) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const color =
    type === "success"
      ? "bg-violet-100 text-violet-900 border-violet-400"
      : type === "error"
      ? "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400"
      : type === "warning"
      ? "bg-pink-100 text-pink-900 border-pink-400"
      : "bg-indigo-100 text-indigo-900 border-indigo-400";

  const icon =
    type === "success" ? (
      <svg className="w-5 h-5 mr-2 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    ) : type === "error" ? (
      <svg className="w-5 h-5 mr-2 text-fuchsia-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    ) : type === "warning" ? (
      <svg className="w-5 h-5 mr-2 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 17a5 5 0 100-10 5 5 0 000 10z" /></svg>
    ) : (
      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
    );

  return (
    <div
      className={`fixed top-6 right-6 z-50 min-w-[280px] max-w-xs shadow-lg border-l-4 p-4 rounded flex items-start animate-fade-in-up ${color}`}
      role="alert"
      aria-live="assertive"
    >
      {icon}
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-700 focus:outline-none"
          aria-label="Fermer la notification"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
      )}
    </div>
  );
}

// Animation CSS à ajouter dans globals.css :
// .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(.39,.575,.565,1.000) both; }
// @keyframes fadeInUp { 0% { opacity:0; transform:translateY(30px);} 100% { opacity:1; transform:translateY(0);} } 