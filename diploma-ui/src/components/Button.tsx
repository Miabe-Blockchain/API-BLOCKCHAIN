import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Button({
  children,
  variant = "primary",
  loading = false,
  icon,
  size = "md",
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary:
      "bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800",
    secondary:
      "bg-indigo-100 text-indigo-900 hover:bg-indigo-200 active:bg-indigo-300 border border-indigo-300",
    danger:
      "bg-fuchsia-600 text-white hover:bg-fuchsia-700 active:bg-fuchsia-800",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  return (
    <button
      className={
        `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim()
      }
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin mr-2 h-5 w-5 text-violet-200" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
} 