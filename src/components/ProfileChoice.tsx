"use client";
import { useId } from "react";
import { PERFIS, type Perfil } from "@/lib/regras";
export function ProfileChoice({ value, onChange, optional = false, disabled = false }: { value: Perfil; onChange: (value: Perfil) => void; optional?: boolean; disabled?: boolean }) {
  const id = useId();
  return <fieldset className="profile-choice" role="radiogroup" disabled={disabled}>
    <legend>Quem vai atravessar?</legend>
    {Object.entries(PERFIS).filter(([key]) => optional || key !== "outro").map(([key, label]) => <label key={key}>
      <input type="radio" name={id} value={key} checked={value === key} onChange={() => onChange(key as Perfil)} />{label}
    </label>)}
  </fieldset>;
}
