import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  hover = false,
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
}) {
  return (
    <div
      className={`surface-card ${hover ? "surface-card-hover" : ""} ${padding ? "p-4 sm:p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const variants = {
    primary:
      "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-700 focus-visible:ring-brand-200",
    secondary:
      "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-slate-200",
    danger:
      "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-700 focus-visible:ring-red-200",
    ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-200",
  };
  const sizes = {
    sm: "rounded-lg px-3 py-2 text-xs min-h-[36px]",
    md: "rounded-xl px-4 py-2.5 text-sm min-h-[44px]",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  name,
  type = "text",
  defaultValue,
  value,
  onChange,
  required,
  min,
  max,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  min?: number | string;
  max?: number | string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={required}
        min={min}
        max={max}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input-field"
      />
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="input-field"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-red-200",
    brand: "bg-brand-50 text-brand-700 ring-brand-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`page-header ${className}`}>
      <div className="page-header__content">
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            {icon}
          </div>
        )}
        <div>
          <h2 className="section-title">{title}</h2>
          {description && <p className="section-subtitle">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "danger" | "warning" | "brand";
}) {
  const tones = {
    neutral: "border-slate-200 bg-white",
    danger: "border-red-200 bg-red-50/50",
    warning: "border-amber-200 bg-amber-50/50",
    brand: "border-brand-200 bg-brand-50/50",
  };
  const values = {
    neutral: "text-slate-900",
    danger: "text-red-700",
    warning: "text-amber-800",
    brand: "text-brand-700",
  };

  return (
    <div className={`rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 ${tones[tone]}`}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold tabular-nums sm:mt-1 sm:text-2xl ${values[tone]}`}>{value}</p>
    </div>
  );
}
