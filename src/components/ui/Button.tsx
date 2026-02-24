"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

const variantClasses: Record<
  ButtonVariant,
  string
> = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-90 focus-visible:ring-accent",
  secondary:
    "border border-separator-line bg-surface-muted text-text-muted shadow-sm hover:bg-[#FAFAFA] focus-visible:ring-separator-line",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Icona a sinistra del testo (es. logo Google) */
  leftIcon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  leftIcon,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  );
}
