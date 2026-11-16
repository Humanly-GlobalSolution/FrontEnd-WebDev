import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Farol Amigo — início">
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="brand-symbol">
        <BrandMark />
      </svg>
      <span>Farol Amigo</span>
    </Link>
  );
}
