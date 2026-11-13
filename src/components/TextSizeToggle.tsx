"use client";

import { useState } from "react";

export function TextSizeToggle() {
  const [enlarged, setEnlarged] = useState(false);

  function toggleTextSize() {
    const next = !enlarged;
    document.documentElement.classList.toggle("large-text", next);
    setEnlarged(next);
  }

  return (
    <button className="text-size-toggle" type="button" aria-pressed={enlarged} onClick={toggleTextSize}>
      <span aria-hidden="true">{enlarged ? "A−" : "A+"}</span>
      <span>{enlarged ? "Letra padrão" : "Letra maior"}</span>
    </button>
  );
}
