"use client";

import { useId, type InputHTMLAttributes, type Ref } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export function TextField({ label, hint, error, inputRef, id, className = "", "aria-describedby": describedBy, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const description = [describedBy, hint ? `${inputId}-hint` : undefined, error ? `${inputId}-error` : undefined].filter(Boolean).join(" ");

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input {...props} ref={inputRef} id={inputId} className={`text-input ${className}`} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={description || undefined} />
      {hint ? <p id={`${inputId}-hint`} className="field-hint">{hint}</p> : null}
      {error ? <p id={`${inputId}-error`} className="field-error">{error}</p> : null}
    </div>
  );
}
