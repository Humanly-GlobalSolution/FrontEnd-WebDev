"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MultimediaMark } from "@/components/MultimediaMark";

// Six frames at 350 ms each in the supplied GIF.
const CROSSING_DURATION_MS = 2100;
const EXIT_DURATION_MS = 800;

export function InitialLoader() {
  const imageRef = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let crossingFinished = false;
    let started = false;
    let disposed = false;
    let crossingTimer: ReturnType<typeof setTimeout> | undefined;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;

    function beginExit() {
      if (exitTimer !== undefined) return;
      if (reducedMotion.matches) {
        setVisible(false);
        return;
      }
      setExiting(true);
      exitTimer = setTimeout(() => setVisible(false), EXIT_DURATION_MS);
    }

    function revealWhenReady() {
      if (crossingFinished && document.readyState === "complete") beginExit();
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
        setAnimating(true);
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
    const safetyTimer = setTimeout(beginExit, 10000);

    return () => {
      disposed = true;
      clearTimeout(crossingTimer);
      clearTimeout(exitTimer);
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
      <div className="initial-loader" data-exiting={exiting} data-animating={animating} style={{ "--loader-exit-duration": `${EXIT_DURATION_MS}ms`, "--crossing-duration": `${CROSSING_DURATION_MS}ms` } as CSSProperties} role="status" aria-live="polite" aria-label="Farol Amigo. Carregando…">
        <div className="initial-loader-artwork" aria-hidden="true">
          {/* Native image preserves playback of the supplied GIF. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageRef} src="/images/farol-amigo-preloader-static.png" className="initial-loader-scene" width="387" height="666" alt="" />
          <svg className="initial-loader-contour" viewBox="-16 0 403 666" fill="none">
            <path className="initial-loader-driver-outline" d="M8 217 C-7 231-12 251 0 277" stroke="#eeefed" strokeWidth="1.3" strokeLinecap="round" />
            {/* Replace only the inner display, preserving its drawn bezel. */}
            <path d="M159 331 Q159 328 164 328 L233 329 Q237 329 237 334 L236 373 L158 373 Z" fill="#121619" />
            <g className="initial-loader-display-logo" transform="translate(178 331) scale(0.8)">
              <g className="initial-loader-logo-ink"><MultimediaMark /></g>
            </g>
          </svg>
        </div>
      </div>
      <noscript><style>{".initial-loader { display: none; }"}</style></noscript>
    </>
  );
}
