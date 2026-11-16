"use client";

import { useEffect, useRef, useState } from "react";

// Six frames at 350 ms each in the supplied GIF.
const CROSSING_DURATION_MS = 2100;

export function InitialLoader() {
  const imageRef = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let crossingFinished = false;
    let started = false;
    let disposed = false;
    let crossingTimer: ReturnType<typeof setTimeout> | undefined;

    function revealWhenReady() {
      if (crossingFinished && document.readyState === "complete") setVisible(false);
    }
    function finishCrossing() {
      crossingFinished = true;
      // Freeze the final pose while any remaining page resources load.
      image!.src = "/images/farol-amigo-preloader-static.png";
      revealWhenReady();
    }
    function startCrossing() {
      if (started) return;
      started = true;
      if (reducedMotion.matches) {
        finishCrossing();
      } else {
        crossingTimer = setTimeout(finishCrossing, CROSSING_DURATION_MS);
      }
    }
    function handleImageError() {
      crossingFinished = true;
      revealWhenReady();
    }
    function handleMotionChange() {
      if (reducedMotion.matches) {
        clearTimeout(crossingTimer);
        finishCrossing();
      }
    }

    image.addEventListener("load", startCrossing);
    image.addEventListener("error", handleImageError);
    window.addEventListener("load", revealWhenReady);
    reducedMotion.addEventListener("change", handleMotionChange);
    // Start after hydration, keeping playback and the timer together.
    image.src = reducedMotion.matches
      ? "/images/farol-amigo-preloader-static.png"
      : "/images/farol-amigo-preloader.gif";
    if (image.complete && image.naturalWidth > 0) {
      queueMicrotask(() => { if (!disposed) startCrossing(); });
    }
    const safetyTimer = setTimeout(() => setVisible(false), 10000);

    return () => {
      disposed = true;
      clearTimeout(crossingTimer);
      clearTimeout(safetyTimer);
      image.removeEventListener("load", startCrossing);
      image.removeEventListener("error", handleImageError);
      window.removeEventListener("load", revealWhenReady);
      reducedMotion.removeEventListener("change", handleMotionChange);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <div className="initial-loader" role="status" aria-live="polite" aria-label="Farol Amigo. Carregando…">
        <div className="initial-loader-artwork" aria-hidden="true">
          {/* Native image preserves playback of the supplied GIF. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageRef} src="/images/farol-amigo-preloader-static.png" className="initial-loader-scene" width="387" height="666" alt="" />
          <svg className="initial-loader-contour" viewBox="0 0 387 666" fill="none">
            <path d="M8 218 C-3 225-9 237-8 252 C-7 269-2 286 10 299" stroke="#eeefed" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <noscript><style>{".initial-loader { display: none; }"}</style></noscript>
    </>
  );
}
