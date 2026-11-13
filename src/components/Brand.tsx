import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Farol Amigo — início">
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="brand-symbol">
        <circle cx="24" cy="24" r="20" stroke="var(--color-signal)" strokeWidth="4" strokeDasharray="96 30" strokeLinecap="round" transform="rotate(-90 24 24)" />
        <path d="M6 18a20 20 0 0 1 10-12" stroke="var(--color-road)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="26" cy="12" r="3" fill="currentColor" />
        <path d="m22 19 5 5 7 1m-11-7-5 7-5 2m11-9-3 12 7 9m-7-9-5 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Farol Amigo</span>
    </Link>
  );
}
