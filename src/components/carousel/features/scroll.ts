// src/components/carousel/features/scroll.ts
//
// Native scrolling for the carousel. The scroller is a real overflow
// container (touch, trackpad, wheel and assistive technologies work as
// they do anywhere), a track sized to the scroll range holds one snap
// point per item, and on every scroll event the items are placed from the
// keyline strategy: translated to their centre and clipped to their
// visible size, as the Compose carousel masks its items.

import { CarouselConfig, CarouselVariant } from "../types";
import { CAROUSEL_DEFAULTS, CAROUSEL_EVENTS, CAROUSEL_VARIANTS } from "../constants";
import { resolveLayoutDefaults } from "../config";
import {
  KeylineRules,
  multiBrowseKeylines,
  heroKeylines,
  uncontainedKeylines,
  fullScreenKeylines,
} from "../keylines";
import {
  Strategy,
  createStrategy,
  keylinesForScrollOffset,
  snapPositionOffset,
  maxScrollOffset,
  placeItem,
} from "../strategy";
import type { SlidesComponent } from "./slides";

/** A mouse drag faster than this (px per ms) advances one item in its direction */
const FLING_VELOCITY = 0.4;
/** Pointer travel below this is a click, not a drag */
const DRAG_THRESHOLD = 4;

interface ScrollComponent {
  getCurrentSlide: () => number;
  getVariant: () => CarouselVariant;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  lifecycle: { destroy: () => void };
}

export const withScroll = (config: CarouselConfig) =>
  <C extends SlidesComponent & { emit?: (event: string, data?: unknown) => unknown; lifecycle?: { destroy: () => void } }>(
    component: C,
  ): C & ScrollComponent => {
    const { variant, gap, padding, snap } = resolveLayoutDefaults(config);
    const vertical = variant === CAROUSEL_VARIANTS.FULL_SCREEN;
    const rules: KeylineRules = {
      minSmallSize: config.minSmallItemWidth ?? CAROUSEL_DEFAULTS.MIN_SMALL_ITEM_WIDTH,
      maxSmallSize: config.maxSmallItemWidth ?? CAROUSEL_DEFAULTS.MAX_SMALL_ITEM_WIDTH,
      anchorSize: CAROUSEL_DEFAULTS.ANCHOR_SIZE,
      mediumLargeThreshold: CAROUSEL_DEFAULTS.MEDIUM_LARGE_THRESHOLD,
    };
    const cornerRadius = config.cornerRadius ?? CAROUSEL_DEFAULTS.CORNER_RADIUS;
    const reduceMotion =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    const { element, scroller, track, slideElements } = component;
    const prefix = component.getClass("carousel");
    const snapClass = `${prefix}__snap`;
    element.classList.toggle(`${prefix}--snap`, snap);

    let strategy: Strategy | null = null;
    let count = 0;
    let containerSize = 0;
    let scrollOffsetAtStart = 0;
    let snapPositions: number[] = [];
    let currentIndex = Math.max(0, config.initialSlide ?? CAROUSEL_DEFAULTS.INITIAL_SLIDE);
    const lastStyles = new WeakMap<HTMLElement, string>();

    // A programmatic scroll reports its target, not every item it passes
    let pending: number | null = null;
    let pendingTimer = 0;
    const clearPending = (): void => {
      pending = null;
      window.clearTimeout(pendingTimer);
    };
    const expect = (index: number): void => {
      pending = index;
      window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(clearPending, 1000);
    };

    const scrollPosition = (): number => (vertical ? scroller.scrollTop : scroller.scrollLeft);
    const setScrollPosition = (value: number, smooth: boolean): void => {
      const behavior = smooth && !reduceMotion?.matches ? "smooth" : "auto";
      if (typeof scroller.scrollTo === "function") {
        scroller.scrollTo(vertical ? { top: value, behavior } : { left: value, behavior });
      } else if (vertical) {
        scroller.scrollTop = value;
      } else {
        scroller.scrollLeft = value;
      }
    };

    const emitChange = (): void => {
      component.emit?.(CAROUSEL_EVENTS.CHANGE, { index: currentIndex });
    };

    const nearestIndex = (position: number): number => {
      let best = 0;
      let bestDistance = Number.MAX_VALUE;
      snapPositions.forEach((snapPosition, i) => {
        const distance = Math.abs(position - snapPosition);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      return best;
    };

    // ── Strategy ────────────────────────────────────────────────

    const buildKeylines = (size: number) => {
      // Reduced motion: items keep one size and run past the edges
      // (m3.material.io carousel accessibility)
      const uniform = reduceMotion?.matches === true;
      const preferred = config.itemWidth ?? CAROUSEL_DEFAULTS.ITEM_WIDTH;
      switch (variant) {
        case CAROUSEL_VARIANTS.HERO:
        case CAROUSEL_VARIANTS.HERO_CENTER: {
          const max = config.itemWidth ?? null;
          return uniform
            ? uncontainedKeylines(size, Math.min(max ?? size, size), gap, rules)
            : heroKeylines(size, max, gap, count, variant === CAROUSEL_VARIANTS.HERO_CENTER, rules);
        }
        case CAROUSEL_VARIANTS.UNCONTAINED:
          return uncontainedKeylines(size, preferred, gap, rules);
        case CAROUSEL_VARIANTS.FULL_SCREEN:
          return fullScreenKeylines(size, gap, rules);
        default:
          return uniform
            ? uncontainedKeylines(size, preferred, gap, rules)
            : multiBrowseKeylines(size, preferred, gap, count, rules);
      }
    };

    const build = (): void => {
      count = slideElements.length;
      containerSize = vertical ? scroller.clientHeight : scroller.clientWidth;
      currentIndex = count ? Math.min(currentIndex, count - 1) : 0;
      if (containerSize <= 0 || count === 0) {
        strategy = null;
        return;
      }
      const afterPadding = variant === CAROUSEL_VARIANTS.UNCONTAINED ? 0 : padding;
      strategy = createStrategy(buildKeylines(containerSize), containerSize, gap, padding, afterPadding);
      if (!strategy.valid) {
        strategy = null;
        return;
      }

      const unit = strategy.itemSize + strategy.gap;
      scrollOffsetAtStart = -snapPositionOffset(strategy, 0, count);
      snapPositions = slideElements.map((_, i) => i * unit - snapPositionOffset(strategy!, i, count) - scrollOffsetAtStart);
      const scrollRange = Math.max(0, snapPositions[count - 1] ?? 0);

      // Track length and one snap point per item
      track.style[vertical ? "height" : "width"] = `${containerSize + scrollRange}px`;
      track.style[vertical ? "width" : "height"] = "";
      track.querySelectorAll(`.${snapClass}`).forEach((el) => el.remove());
      const fragment = document.createDocumentFragment();
      snapPositions.forEach((snapPosition) => {
        const point = document.createElement("div");
        point.className = snapClass;
        point.style[vertical ? "top" : "left"] = `${snapPosition}px`;
        fragment.appendChild(point);
      });
      track.appendChild(fragment);

      slideElements.forEach((el) => {
        el.style[vertical ? "height" : "width"] = `${strategy!.itemSize}px`;
        el.style[vertical ? "width" : "height"] = "";
      });
      element.style.setProperty("--mtrl-carousel-corner", `${cornerRadius}px`);
    };

    // ── Placement ───────────────────────────────────────────────

    const layout = (): void => {
      if (!strategy) return;
      const position = scrollPosition();
      const scrollOffset = position + scrollOffsetAtStart;
      const keylines = keylinesForScrollOffset(strategy, scrollOffset, maxScrollOffset(strategy, count));
      const itemSize = strategy.itemSize;
      const fadeRange = strategy.maxItemSize - strategy.minItemSize;

      for (let i = 0; i < count; i++) {
        const el = slideElements[i]!;
        const placement = placeItem(strategy, keylines, i, scrollOffset);
        const visible = Math.max(0, Math.min(itemSize, placement.size));
        // Keylines are container coordinates; the items live inside the
        // scrolled track, so the scroll position is added back
        const start = placement.center - itemSize / 2 + position;
        const offscreen = placement.center + visible / 2 < -itemSize || placement.center - visible / 2 > containerSize + itemSize;
        const inset = Math.max(0, (itemSize - visible) / 2);
        const fade = fadeRange > 0 ? Math.min(1, Math.max(0, (visible - strategy.minItemSize) / fadeRange)) : 1;
        const style = offscreen
          ? "hidden"
          : `${Math.round(start * 100) / 100}|${Math.round(inset * 100) / 100}|${fade.toFixed(3)}`;
        if (lastStyles.get(el) === style) continue;
        lastStyles.set(el, style);
        if (offscreen) {
          el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "";
        el.style.transform = vertical ? `translate3d(0, ${start}px, 0)` : `translate3d(${start}px, 0, 0)`;
        el.style.clipPath = vertical
          ? `inset(${inset}px 0 round ${cornerRadius}px)`
          : `inset(0 ${inset}px round ${cornerRadius}px)`;
        el.style.setProperty("--mtrl-carousel-fade", fade.toFixed(3));
      }

      if (pending !== null) {
        if (Math.abs(scrollPosition() - (snapPositions[pending] ?? 0)) < 1) clearPending();
        return;
      }
      const index = nearestIndex(scrollPosition());
      if (index !== currentIndex) {
        currentIndex = index;
        emitChange();
      }
    };

    const rebuild = (): void => {
      build();
      if (strategy) {
        expect(currentIndex);
        setScrollPosition(snapPositions[currentIndex] ?? 0, false);
      }
      layout();
    };

    // ── Navigation ──────────────────────────────────────────────

    const goTo = (index: number): void => {
      if (!count) return;
      const target = Math.min(Math.max(index, 0), count - 1);
      if (strategy) {
        expect(target);
        setScrollPosition(snapPositions[target] ?? 0, true);
      }
      if (target !== currentIndex) {
        currentIndex = target;
        emitChange();
      }
    };
    const next = (): void => goTo(currentIndex + 1);
    const prev = (): void => goTo(currentIndex - 1);

    // ── Keyboard and focus (m3.material.io carousel accessibility) ──

    const indexOf = (target: EventTarget | null): number => {
      const item = (target as HTMLElement | null)?.closest?.(`.${prefix}__item`) as HTMLElement | null;
      return item ? slideElements.indexOf(item) : -1;
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      const from = indexOf(e.target);
      if (from < 0) return;
      const forward = vertical ? "ArrowDown" : "ArrowRight";
      const backward = vertical ? "ArrowUp" : "ArrowLeft";
      let target = -1;
      if (e.key === forward) target = from + 1;
      else if (e.key === backward) target = from - 1;
      else if (e.key === "Home") target = 0;
      else if (e.key === "End") target = count - 1;
      if (target < 0 || target >= count) return;
      e.preventDefault();
      slideElements[target]!.focus({ preventScroll: true });
      goTo(target);
    };

    const handleFocusIn = (e: FocusEvent): void => {
      const index = indexOf(e.target);
      if (index >= 0 && index !== currentIndex) goTo(index);
    };

    // ── Mouse drag (touch and trackpad scroll natively) ─────────

    let dragging = false;
    let dragged = false;
    let dragStart = 0;
    let dragScrollStart = 0;
    let dragLast = 0;
    let dragLastTime = 0;
    let dragVelocity = 0;
    let settleTimer = 0;

    // While the mouse drags and until the release scroll settles, the
    // snap points are off so they do not fight the pointer
    const restoreSnap = (): void => {
      window.clearTimeout(settleTimer);
      scroller.removeEventListener("scrollend", restoreSnap);
      delete element.dataset.settling;
    };

    const handlePointerDown = (e: PointerEvent): void => {
      clearPending();
      if (e.pointerType !== "mouse" || e.button !== 0 || !strategy) return;
      dragging = true;
      dragged = false;
      dragStart = vertical ? e.clientY : e.clientX;
      dragLast = dragStart;
      dragLastTime = e.timeStamp;
      dragVelocity = 0;
      dragScrollStart = scrollPosition();
      restoreSnap();
      element.dataset.settling = "true";
      scroller.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent): void => {
      if (!dragging) return;
      const position = vertical ? e.clientY : e.clientX;
      const delta = position - dragStart;
      if (!dragged && Math.abs(delta) < DRAG_THRESHOLD) return;
      dragged = true;
      element.dataset.dragging = "true";
      const dt = e.timeStamp - dragLastTime;
      if (dt > 0) dragVelocity = (position - dragLast) / dt;
      dragLast = position;
      dragLastTime = e.timeStamp;
      if (vertical) scroller.scrollTop = dragScrollStart - delta;
      else scroller.scrollLeft = dragScrollStart - delta;
      e.preventDefault();
    };

    const handlePointerUp = (e: PointerEvent): void => {
      if (!dragging) return;
      dragging = false;
      if (scroller.hasPointerCapture(e.pointerId)) scroller.releasePointerCapture(e.pointerId);
      delete element.dataset.dragging;
      if (!dragged) {
        restoreSnap();
        return;
      }
      if (snap) {
        let target = nearestIndex(scrollPosition());
        if (dragVelocity < -FLING_VELOCITY) target = Math.min(count - 1, target + 1);
        else if (dragVelocity > FLING_VELOCITY) target = Math.max(0, target - 1);
        goTo(target);
        scroller.addEventListener("scrollend", restoreSnap, { once: true });
        settleTimer = window.setTimeout(restoreSnap, 600);
      } else {
        restoreSnap();
      }
    };

    // A drag must not activate a link or button inside the item
    const handleClick = (e: MouseEvent): void => {
      if (dragged) {
        dragged = false;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // ── Wiring ──────────────────────────────────────────────────

    scroller.addEventListener("scroll", layout, { passive: true });
    scroller.addEventListener("wheel", clearPending, { passive: true });
    scroller.addEventListener("touchstart", clearPending, { passive: true });
    scroller.addEventListener("keydown", handleKeyDown);
    scroller.addEventListener("focusin", handleFocusIn);
    scroller.addEventListener("pointerdown", handlePointerDown);
    scroller.addEventListener("pointermove", handlePointerMove);
    scroller.addEventListener("pointerup", handlePointerUp);
    scroller.addEventListener("pointercancel", handlePointerUp);
    scroller.addEventListener("click", handleClick, true);
    reduceMotion?.addEventListener?.("change", rebuild);

    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(rebuild) : null;
    resizeObserver?.observe(scroller);

    component.onSlidesChanged(rebuild);
    rebuild();

    const destroy = component.lifecycle?.destroy;
    const enhanced = component as C & ScrollComponent;
    enhanced.getCurrentSlide = () => currentIndex;
    enhanced.getVariant = () => variant;
    enhanced.next = next;
    enhanced.prev = prev;
    enhanced.goTo = goTo;
    enhanced.lifecycle = {
      destroy: () => {
        restoreSnap();
        resizeObserver?.disconnect();
        reduceMotion?.removeEventListener?.("change", rebuild);
        clearPending();
        scroller.removeEventListener("scroll", layout);
        scroller.removeEventListener("wheel", clearPending);
        scroller.removeEventListener("touchstart", clearPending);
        scroller.removeEventListener("keydown", handleKeyDown);
        scroller.removeEventListener("focusin", handleFocusIn);
        scroller.removeEventListener("pointerdown", handlePointerDown);
        scroller.removeEventListener("pointermove", handlePointerMove);
        scroller.removeEventListener("pointerup", handlePointerUp);
        scroller.removeEventListener("pointercancel", handlePointerUp);
        scroller.removeEventListener("click", handleClick, true);
        destroy?.();
      },
    };
    return enhanced;
  };
