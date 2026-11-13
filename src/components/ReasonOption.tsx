import type { ReviewReason } from "@/lib/reviewRequests";

type ReasonOptionProps = {
  value: ReviewReason;
  label: string;
  checked: boolean;
  onChange: (value: ReviewReason) => void;
  invalid: boolean;
};

export function ReasonOption({ value, label, checked, onChange, invalid }: ReasonOptionProps) {
  return (
    <label className={`reason-option${checked ? " reason-selected" : ""}`}>
      <input type="radio" name="motivo" value={value} checked={checked} onChange={() => onChange(value)} required aria-describedby={invalid ? "reason-error" : undefined} />
      <span>{label}</span>
    </label>
  );
}
