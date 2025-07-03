import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, error, options, className = "", ...rest }: SelectProps) {
  return (
    <div className="mb-4">
      {label && <label className="block mb-1 text-sm font-medium text-violet-700">{label}</label>}
      <select
        className={`w-full px-4 py-2 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 placeholder-violet-300 bg-white ${
          error ? "border-fuchsia-400 text-fuchsia-700" : "border-violet-200 text-gray-900"
        } ${className}`}
        {...rest}
      >
        <option value="" disabled hidden className="text-violet-300">Sélectionner…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-violet-100">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <div className="mt-1 text-xs text-fuchsia-600">{error}</div>}
    </div>
  );
} 