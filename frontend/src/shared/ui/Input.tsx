import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass =
  "w-full rounded-2xl bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-muted outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-brand-green/25";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
      <input id={inputId} className={`${fieldClass} ${className}`} {...props} />
      {error ? <span className="text-xs text-brand-red">{error}</span> : null}
    </label>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({ label, error, id, options, className = "", ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
      <select id={selectId} className={`${fieldClass} ${className}`} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-brand-red">{error}</span> : null}
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, id, className = "", ...props }: TextareaProps) {
  const areaId = id ?? props.name;
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
      <textarea id={areaId} className={`${fieldClass} min-h-24 ${className}`} {...props} />
      {error ? <span className="text-xs text-brand-red">{error}</span> : null}
    </label>
  );
}
