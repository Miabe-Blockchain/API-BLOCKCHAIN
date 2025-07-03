import React from "react";

type BadgeProps = {
  type?: "success" | "error" | "warning" | "info" | "neutral";
  children: React.ReactNode;
  className?: string;
};

export default function Badge({ type = "neutral", children, className = "" }: BadgeProps) {
  const color =
    type === "success"
      ? "bg-emerald-100 text-emerald-900 border-emerald-400"
      : type === "error"
      ? "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400"
      : type === "warning"
      ? "bg-amber-100 text-amber-900 border-amber-400"
      : type === "info"
      ? "bg-indigo-100 text-indigo-900 border-indigo-400"
      : "bg-gray-100 text-gray-900 border-gray-300";
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${color} ${className}`}>
      {children}
    </span>
  );
} 