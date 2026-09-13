// src/components/ui/DatePicker.jsx
import React from 'react';

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder,
  error,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1">
          {label}
        </label>
      )}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all"
        {...props}
      />
      {error && <p className="text-[10px] text-err mt-0.5">{error}</p>}
    </div>
  );
}
