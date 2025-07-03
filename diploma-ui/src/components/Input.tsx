import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", ...rest }: InputProps) {
  return (
    <div className="mb-4">
      {label && <label className="block mb-1 text-sm font-medium text-violet-700">{label}</label>}
      <input
        className={`w-full px-4 py-2 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 placeholder-violet-300 ${
          error ? "border-fuchsia-400 text-fuchsia-700" : "border-violet-200 text-gray-900"
        } ${className}`}
        {...rest}
      />
      {error && <div className="mt-1 text-xs text-fuchsia-600">{error}</div>}
    </div>
  );
} 