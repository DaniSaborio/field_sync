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
    <div className="flex items-center gap-2.5 border border-black bg-paper px-3.5 py-2 focus-within:outline-2 focus-within:outline-black focus-within:outline-offset-2">
      <span className="text-black">{icon}</span>
      <div className="flex-1">
        <label
          htmlFor={id}
          className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted"
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
          className="w-full bg-transparent font-sans text-sm text-black outline-none placeholder:text-muted"
        />
      </div>
      {rightSlot}
    </div>
  );
}
