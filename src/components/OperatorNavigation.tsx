"use client";

import { useEffect, useRef } from "react";

export function OperatorNavigation() {
  const rail = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = rail.current;
    const nav = navigation.current;
    if (!container || !nav) return;
    const desktop = window.matchMedia("(width > 60rem)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previousTime = 0;
    let current = 0;
    let target = 0;

    function animate(time: number) {
      const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
      previousTime = time;
      // Amortecimento independente da taxa de atualização, sem rebote.
      current += (target - current) * (1 - Math.exp(-elapsed / 55));
      const settled = Math.abs(target - current) < 0.2;
      if (settled) current = target;
      nav!.style.transform = `translateY(${current}px)`;
      frame = settled ? 0 : requestAnimationFrame(animate);
      if (settled) previousTime = 0;
    }

    function update() {
      if (!desktop.matches || reducedMotion.matches) {
        cancelAnimationFrame(frame);
        frame = previousTime = current = target = 0;
        delete nav!.dataset.followScroll;
        nav!.style.removeProperty("transform");
        return;
      }
      nav!.dataset.followScroll = "true";
      const bounds = container!.getBoundingClientRect();
      const inset = parseFloat(getComputedStyle(document.documentElement).fontSize);
      target = Math.max(0, Math.min(inset - bounds.top, bounds.height - nav!.offsetHeight));
      if (!frame) frame = requestAnimationFrame(animate);
    }

    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(nav);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    desktop.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      desktop.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
      delete nav.dataset.followScroll;
      nav.style.removeProperty("transform");
    };
  }, []);

  return <div className="operator-nav-rail" ref={rail}>
    <nav ref={navigation} className="operator-nav" aria-label="Seções do painel">
      <span>Operação</span>
      <a href="#operator-overview">Visão geral</a>
      <a href="#operator-crossings">Cruzamentos</a>
      <a href="#operator-alerts">Alertas</a>
      <a href="#operator-requests">Pedidos dos cidadãos</a>
    </nav>
  </div>;
}
