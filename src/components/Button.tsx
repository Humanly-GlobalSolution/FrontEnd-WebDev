import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
};

export function Button({ variant = "primary", loading = false, disabled, children, className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button {...props} type={type} className={`button button-${variant} ${className}`} disabled={disabled || loading} aria-busy={loading}>
      {loading ? "Aguarde…" : children}
    </button>
  );
}
