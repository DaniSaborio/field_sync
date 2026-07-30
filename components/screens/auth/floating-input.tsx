import type { ReactNode } from "react";

type FloatingInputProps = {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  icon: ReactNode;
  rightSlot?: ReactNode;
};

export function FloatingInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  icon,
  rightSlot,
}: FloatingInputProps) {
  return (
    <div className="relative rounded-xl border border-white/10 bg-white/[0.03] px-3.5 pb-2 pt-2 transition focus-within:border-emerald-400/60 focus-within:bg-white/[0.05] focus-within:ring-4 focus-within:ring-emerald-400/10">
      <div className="flex items-center gap-2.5">
        <span className="text-slate-500">{icon}</span>
        <div className="flex-1">
          <label
            htmlFor={id}
            className="block text-[10px] font-semibold tracking-[0.08em] text-slate-500"
          >
            {label}
          </label>
          <input
            id={id}
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            required={required}
            minLength={minLength}
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
          />
        </div>
        {rightSlot}
      </div>
    </div>
  );
}