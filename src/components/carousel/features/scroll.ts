// src/components/carousel/features/scroll.ts
// Virtual-scroll carousel engine ported from vlist.
// Manages scroll position, infinite loop, snap-to-item, per-frame layout,
// and CSS custom property updates. No native scrolling — all items are
// positioned with CSS transforms.

import { CarouselConfig } from "../types";
import { createLayoutEngine } from "../engine";
import type { LayoutEngine } from "../engine";
import { resolvePreset, hasSlots } from "../presets";
import type { TextFade, SlotConfigResolver } from "../presets";
import { CAROUSEL_EVENTS, CAROUSEL_DEFAULTS } from "../constants";

interface NormalizedVariant {
  variant: string;
  resolveSlots: SlotConfigResolver;
}

function normalizeVariant(
  input: CarouselConfig["variant"],
): NormalizedVariant {
  if (typeof input === "function") {
    return { variant: "custom", resolveSlots: input as SlotConfigResolver };
  }
  if (typeof input === "object" && input !== null && "slots" in input) {
    const slots = input;
    return { variant: "custom", resolveSlots: () => slots };
  }
  const name = (input as string) || CAROUSEL_DEFAULTS.VARIANT;
  return {
    variant: name,
    resolveSlots: (containerSize, peek) => resolvePreset(name, containerSize, peek),
  };
}

function resolvePeekSize(peekConfig: CarouselConfig["peek"], containerSize: number): number {
  if (typeof peekConfig === "number") return peekConfig;
  if (typeof peekConfig === "string" && peekConfig.endsWith("%")) {
    return Math.round(containerSize * parseFloat(peekConfig) / 100);
  }
  return Math.max(40, Math.min(Math.round(containerSize * 0.15), 120));
}

export const withScroll = (config: CarouselConfig) => (component: any) => {
  const { resolveSlots } = normalizeVariant(config.variant);
  const snapEnabled = config.snap ?? CAROUSEL_DEFAULTS.SNAP;
  const snapDuration = config.snapDuration ?? CAROUSEL_DEFAULTS.SNAP_DURATION;
  const gapPx = config.gap ?? CAROUSEL_DEFAULTS.GAP;
  const peekConfig = config.peek ?? CAROUSEL_DEFAULTS.PEEK;
  const initialIndex = config.initialSlide ?? CAROUSEL_DEFAULTS.INITIAL_SLIDE;

  const track: HTMLElement = component.trackElement;
  const container: HTMLElement = component.element;
  const prefix = component.getClass("carousel");

  // State
  let scrollPosition = 0;
  let currentIndex = initialIndex;
  let realTotal = 0;
  let stepSize = 0;
  let lapSize = 0;
  let intendedVi = -1;
  let textFade: TextFade = "role";

  let stepSizes: number[] = [];
  let stepOffsets: number[] = [];
  let layoutEngine: LayoutEngine | null = null;

  // Animation state
  let animFrameId = 0;
  let smoothStart = 0;
  let smoothEnd = 0;
  let smoothStartTime = 0;
  let smoothDuration = 0;
  let isSmoothing = false;

  // Drag state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragCurrentX = 0;
  let dragVelocity = 0;
  let dragLastTime = 0;

  // Idle detection
  let idleTimer = 0;
  const IDLE_DELAY = 150;

  // ── Index math ───────────────────────────────────────────────

  function resolveIndex(index: number): number {
    if (realTotal <= 0) return 0;
    return ((index % realTotal) + realTotal) % realTotal;
  }

  function virtualIndexOf(logicalIndex: number): number {
    return logicalIndex;
  }

  function logicalIndexOf(virtualIndex: number): number {
    if (realTotal <= 0) return 0;
    return ((virtualIndex % realTotal) + realTotal) % realTotal;
  }

  // ── Step cache ───────────────────────────────────────────────

  function buildStepCache(sizes: number[]): void {
    stepSizes = sizes;
    const n = sizes.length;
    stepOffsets = new Array(n + 1);
    stepOffsets[0] = 0;
    for (let i = 0; i < n; i++) {
      stepOffsets[i + 1] = stepOffsets[i]! + sizes[i]!;
    }
    lapSize = n > 0 ? stepOffsets[n]! : 0;
  }

  function decomposeScroll(pos: number): { vi: number; frac: number } {
    if (realTotal <= 0 || lapSize <= 0) return { vi: 0, frac: 0 };
    const cycle = Math.floor(pos / lapSize);
    let rem = pos - cycle * lapSize;
    if (rem < 0) rem = 0;
    const s = stepSizes[0]!;
    const idx = Math.min(Math.floor(rem / s), realTotal - 1);
    return { vi: cycle * realTotal + idx, frac: s > 0 ? (rem / s) - idx : 0 };
  }

  function scrollPositionForVirtual(vi: number): number {
    if (realTotal <= 0 || lapSize <= 0) return 0;
    const cycle = Math.floor(vi / realTotal);
    const within = ((vi % realTotal) + realTotal) % realTotal;
    return cycle * lapSize + (stepOffsets[within] ?? 0);
  }

  function virtualIndexAtScroll(pos: number): number {
    const { vi, frac } = decomposeScroll(pos);
    return frac >= 0.5 ? vi + 1 : vi;
  }

  function getBaseVi(): number {
    if (intendedVi >= 0) return intendedVi;
    return virtualIndexAtScroll(scrollPosition);
  }

  // ── Smooth scroll animation ──────────────────────────────────

  function cancelSmooth(): void {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = 0;
    }
    isSmoothing = false;
  }

  function smoothScrollTo(target: number, duration: number): void {
    cancelSmooth();
    smoothStart = scrollPosition;
    smoothEnd = target;
    smoothStartTime = performance.now();
    smoothDuration = duration;
    isSmoothing = true;
    animFrameId = requestAnimationFrame(smoothStep);
  }

  function smoothStep(now: number): void {
    const elapsed = now - smoothStartTime;
    const t = Math.min(elapsed / smoothDuration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    scrollPosition = smoothStart + (smoothEnd - smoothStart) * eased;
    updateLayout();

    if (t < 1) {
      animFrameId = requestAnimationFrame(smoothStep);
    } else {
      isSmoothing = false;
      animFrameId = 0;
      scheduleIdle();
    }
  }

  // ── Momentum ─────────────────────────────────────────────────

  function startMomentum(velocity: number): void {
    cancelSmooth();
    const friction = 0.95;
    let v = velocity;

    function step(): void {
      v *= friction;
      scrollPosition -= v;
      updateLayout();

      if (Math.abs(v) > 0.5) {
        animFrameId = requestAnimationFrame(step);
      } else {
        animFrameId = 0;
        snapToNearest();
      }
    }

    animFrameId = requestAnimationFrame(step);
  }

  // ── Idle / Snap ──────────────────────────────────────────────

  function scheduleIdle(): void {
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(onIdle, IDLE_DELAY);
  }

  function onIdle(): void {
    intendedVi = -1;
    if (snapEnabled && realTotal > 1) {
      snapToNearest();
    }
  }

  function snapToNearest(): void {
    if (realTotal <= 1) return;
    const nearestVi = virtualIndexAtScroll(scrollPosition);
    const snapTarget = scrollPositionForVirtual(nearestVi);
    if (Math.abs(scrollPosition - snapTarget) > 1) {
      const newIndex = logicalIndexOf(nearestVi);
      if (newIndex !== currentIndex) {
        currentIndex = newIndex;
        emitChange();
      }
      smoothScrollTo(snapTarget, snapDuration);
    }
  }

  // ── Navigation ───────────────────────────────────────────────

  function navigateTo(logicalTarget: number, smooth: boolean, duration: number): void {
    currentIndex = logicalTarget;
    if (realTotal <= 1) return;

    const baseVi = getBaseVi();
    const currentLogical = logicalIndexOf(baseVi);
    const forward = ((logicalTarget - currentLogical) % realTotal + realTotal) % realTotal;
    const backward = realTotal - forward;
    const delta = forward <= backward ? forward : -backward;
    const targetVi = baseVi + delta;
    intendedVi = targetVi;
    const nearestPos = scrollPositionForVirtual(targetVi);

    if (smooth) {
      smoothScrollTo(nearestPos, duration);
    } else {
      scrollPosition = nearestPos;
      updateLayout();
    }
  }

  function next(): void {
    if (realTotal <= 1) return;
    cancelSmooth();
    const prevIndex = currentIndex;
    const baseVi = getBaseVi();
    const targetVi = baseVi + 1;
    intendedVi = targetVi;
    currentIndex = logicalIndexOf(targetVi);
    smoothScrollTo(scrollPositionForVirtual(targetVi), snapDuration);
    if (currentIndex !== prevIndex) emitChange();
  }

  function prev(): void {
    if (realTotal <= 1) return;
    cancelSmooth();
    const prevIndex = currentIndex;
    const baseVi = getBaseVi();
    const targetVi = baseVi - 1;
    intendedVi = targetVi;
    currentIndex = logicalIndexOf(targetVi);
    smoothScrollTo(scrollPositionForVirtual(targetVi), snapDuration);
    if (currentIndex !== prevIndex) emitChange();
  }

  function goTo(index: number): void {
    if (realTotal <= 0) return;
    cancelSmooth();
    const target = resolveIndex(index);
    navigateTo(target, true, snapDuration);
    emitChange();
  }

  // ── Events ───────────────────────────────────────────────────

  function emitChange(): void {
    const event = new CustomEvent(CAROUSEL_EVENTS.SLIDE_CHANGED, {
      detail: { index: currentIndex, scrollPosition },
    });
    container.dispatchEvent(event);
  }

  // ── Per-frame layout update ──────────────────────────────────

  function updateLayout(): void {
    if (realTotal <= 0) return;

    const slides = track.children;
    if (slides.length === 0) return;

    const { vi: focalVi, frac } = decomposeScroll(scrollPosition);
    const baseCycle = focalVi - ((focalVi % realTotal + realTotal) % realTotal);
    const focalWidth = layoutEngine ? (layoutEngine.slotWidths[layoutEngine.focalSlot] ?? 0) : 0;

    if (layoutEngine) {
      const anchor = layoutEngine.getAnchorOffset(focalVi, frac);

      for (let i = 0; i < slides.length; i++) {
        const el = slides[i] as HTMLElement;
        const logical = parseInt(el.dataset.index ?? "0", 10);
        let vi = baseCycle + logical;
        if (vi - focalVi > realTotal / 2) vi -= realTotal;
        if (focalVi - vi > realTotal / 2) vi += realTotal;

        const layout = layoutEngine.getItemLayout(vi, focalVi, frac, anchor);
        const roundedSize = Math.max(0, Math.round(layout.size));
        const roundedOffset = Math.round(layout.offset);

        if (roundedSize <= 0) {
          el.style.display = "none";
        } else {
          el.style.display = "";
          el.style.width = roundedSize + "px";
          el.style.transform = `translateX(${roundedOffset}px)`;
        }

        let roleWeight: number;
        if (textFade === "size") {
          const maxSize = layoutEngine.slotWidths[layoutEngine.focalSlot] ?? 1;
          roleWeight = Math.min(1, Math.max(0, roundedSize / maxSize));
        } else {
          roleWeight = layout.role === "large" ? 1 - layout.progress : 0;
        }

        el.style.setProperty("--mtrl-carousel-progress", layout.progress.toFixed(3));
        el.style.setProperty("--mtrl-carousel-offset", String(layout.relOffset));
        el.style.setProperty("--mtrl-carousel-role", layout.role);
        el.style.setProperty("--mtrl-carousel-role-weight", roleWeight.toFixed(3));
        el.style.setProperty("--mtrl-carousel-width", roundedSize + "px");
        el.style.setProperty("--mtrl-carousel-focal-width", focalWidth + "px");
      }
    } else {
      // Static variant — uniform sizes, no layout engine
      const itemSize = stepSizes[0] ?? 0;
      for (let i = 0; i < slides.length; i++) {
        const el = slides[i] as HTMLElement;
        const logical = parseInt(el.dataset.index ?? "0", 10);
        let vi = baseCycle + logical;
        if (vi - focalVi > realTotal / 2) vi -= realTotal;
        if (focalVi - vi > realTotal / 2) vi += realTotal;

        const absOffset = scrollPositionForVirtual(vi);
        const roundedOffset = Math.round(absOffset - scrollPosition + (container.clientWidth - itemSize) / 2);

        el.style.display = "";
        el.style.width = itemSize + "px";
        el.style.transform = `translateX(${roundedOffset}px)`;

        const relOffset = vi - focalVi;
        const progress = Math.min(1, Math.abs(relOffset) + (relOffset === 0 ? frac : 0));
        const roleWeight = 1 - progress;

        el.style.setProperty("--mtrl-carousel-progress", progress.toFixed(3));
        el.style.setProperty("--mtrl-carousel-offset", String(relOffset));
        el.style.setProperty("--mtrl-carousel-role", "large");
        el.style.setProperty("--mtrl-carousel-role-weight", roleWeight.toFixed(3));
        el.style.setProperty("--mtrl-carousel-width", itemSize + "px");
      }
    }

    // Track change during free scroll (non-programmatic)
    if (intendedVi < 0) {
      const vi = virtualIndexAtScroll(scrollPosition);
      const newIndex = logicalIndexOf(vi);
      if (newIndex !== currentIndex) {
        currentIndex = newIndex;
        emitChange();
      }
    }
  }

  // ── Input handlers ───────────────────────────────────────────

  function handlePointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    cancelSmooth();
    clearTimeout(idleTimer);

    isDragging = true;
    dragStartX = e.clientX;
    dragStartScroll = scrollPosition;
    dragCurrentX = e.clientX;
    dragVelocity = 0;
    dragLastTime = performance.now();

    container.setPointerCapture(e.pointerId);
    container.style.cursor = "grabbing";
    e.preventDefault();
  }

  function handlePointerMove(e: PointerEvent): void {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    scrollPosition = dragStartScroll - dx;
    updateLayout();

    const now = performance.now();
    const dt = now - dragLastTime;
    if (dt > 0) {
      dragVelocity = (e.clientX - dragCurrentX) / dt;
    }
    dragCurrentX = e.clientX;
    dragLastTime = now;
    e.preventDefault();
  }

  function handlePointerUp(e: PointerEvent): void {
    if (!isDragging) return;
    isDragging = false;
    container.releasePointerCapture(e.pointerId);
    container.style.cursor = "";

    if (Math.abs(dragVelocity) > 0.5) {
      startMomentum(dragVelocity);
    } else {
      snapToNearest();
    }
  }

  function handlePointerCancel(e: PointerEvent): void {
    if (!isDragging) return;
    isDragging = false;
    container.releasePointerCapture(e.pointerId);
    container.style.cursor = "";
    snapToNearest();
  }

  function handleWheel(e: WheelEvent): void {
    e.preventDefault();
    cancelSmooth();
    clearTimeout(idleTimer);

    const delta = e.deltaY || e.deltaX;
    scrollPosition += delta * 0.5;
    updateLayout();
    scheduleIdle();
  }

  function handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        prev();
        break;
      case "Home":
        e.preventDefault();
        goTo(0);
        break;
      case "End":
        e.preventDefault();
        goTo(realTotal - 1);
        break;
    }
  }

  // ── Init ─────────────────────────────────────────────────────

  function init(): void {
    const slideEls = track.children;
    realTotal = slideEls.length;
    if (realTotal <= 0) return;

    const containerSize = container.clientWidth;
    const peekResolved = resolvePeekSize(peekConfig, containerSize);
    const presetResult = resolveSlots(containerSize, peekResolved);

    if (hasSlots(presetResult)) {
      textFade = presetResult.textFade ?? "role";
      layoutEngine = createLayoutEngine({
        slots: presetResult.slots,
        focalSlot: presetResult.focalSlot,
        containerSize,
        gap: gapPx,
      });
      stepSize = layoutEngine.stepSize;
      buildStepCache(Array.from({ length: realTotal }, () => stepSize));
    } else {
      textFade = (presetResult && "textFade" in presetResult && presetResult.textFade) ? presetResult.textFade : "viewport";
      stepSize = containerSize;
      buildStepCache(Array.from({ length: realTotal }, () => stepSize));
      layoutEngine = null;
    }

    currentIndex = resolveIndex(initialIndex);
    scrollPosition = scrollPositionForVirtual(virtualIndexOf(currentIndex));
    updateLayout();
  }

  function rebuildOnSlideChange(): void {
    init();
  }

  // ── Event binding ────────────────────────────────────────────

  container.addEventListener("pointerdown", handlePointerDown);
  container.addEventListener("pointermove", handlePointerMove);
  container.addEventListener("pointerup", handlePointerUp);
  container.addEventListener("pointercancel", handlePointerCancel);
  container.addEventListener("wheel", handleWheel, { passive: false });
  container.addEventListener("keydown", handleKeyDown);
  container.setAttribute("tabindex", "0");

  const resizeObserver = new ResizeObserver(() => init());
  resizeObserver.observe(container);

  // Defer init to after slides are in the DOM
  requestAnimationFrame(() => init());

  return {
    ...component,

    getCurrentSlide: () => currentIndex,
    next,
    prev,
    goTo,
    rebuildOnSlideChange,

    lifecycle: {
      ...component.lifecycle,
      destroy: () => {
        cancelSmooth();
        clearTimeout(idleTimer);
        resizeObserver.disconnect();
        container.removeEventListener("pointerdown", handlePointerDown);
        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerup", handlePointerUp);
        container.removeEventListener("pointercancel", handlePointerCancel);
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("keydown", handleKeyDown);
        if (component.lifecycle?.destroy) component.lifecycle.destroy();
      },
    },
  };
};
