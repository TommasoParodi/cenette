"use client";

import { type InputHTMLAttributes, useState, useId } from "react";
import { inputBaseClassName } from "./inputBaseStyles";

export interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  /** Link opzionale a destra della label (es. "Dimenticata?") */
  labelAction?: React.ReactNode;
  /** Per type="password": mostra icona occhio per mostrare/nascondere */
  showPasswordToggle?: boolean;
  /** Classi aggiuntive per il wrapper */
  wrapperClassName?: string;
  /** Mostra stato errore (bordo rosso) */
  error?: boolean;
}

export function InputField({
  label,
  labelAction,
  showPasswordToggle = false,
  wrapperClassName = "",
  error = false,
  id: idProp,
  type: typeProp = "text",
  ...inputProps
}: InputFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const type = typeProp === "password" && showPasswordToggle && showPassword ? "text" : typeProp;

  return (
    <div className={wrapperClassName}>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-label">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          type={type}
          className={
            error
              ? "w-full rounded-xl border border-red-500 bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder-placeholder focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              : inputBaseClassName
          }
          {...inputProps}
        />
        {showPasswordToggle && typeProp === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-placeholder hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 rounded"
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOffIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}
