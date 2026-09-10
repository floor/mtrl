import { SliderConfig, SliderColor } from "../types";
import { SLIDER_SIZES, SLIDER_MEASUREMENTS, SliderSize } from "../constants";

export const getTrackHeight = (size?: SliderSize): number => {
  if (typeof size === "number") {
    return Math.max(size, SLIDER_SIZES.XS);
  }

  if (typeof size === "string" && size in SLIDER_SIZES) {
    return SLIDER_SIZES[size as keyof typeof SLIDER_SIZES];
  }

  return SLIDER_SIZES.XS; // Default to XS
};

/**
 * Gets the handle height based on the slider size
 */
export const getHandleHeight = (size?: SliderSize): number => {
  const trackHeight = getTrackHeight(size);

  // For XS and S sizes, use SMALL_HANDLE_HEIGHT constant
  if (trackHeight <= SLIDER_SIZES.S) {
    return SLIDER_MEASUREMENTS.SMALL_HANDLE_HEIGHT;
  }

  // For M, L, XL sizes, handle height is larger than track by HANDLE_HEIGHT_OFFSET
  return trackHeight + SLIDER_MEASUREMENTS.HANDLE_HEIGHT_OFFSET;
};

/**
 * Gets the external track radius based on the slider size
 */
export const getExternalTrackRadius = (size?: SliderSize): number => {
  const trackHeight = getTrackHeight(size);

  // For XS and S sizes, use SMALL_TRACK_EXTERNAL_RADIUS constant
  if (trackHeight <= SLIDER_SIZES.S) {
    return SLIDER_MEASUREMENTS.SMALL_TRACK_EXTERNAL_RADIUS;
  }

  // For M, L, XL sizes, use track height multiplied by ratio
  return trackHeight * SLIDER_MEASUREMENTS.LARGE_TRACK_RADIUS_RATIO;
};

interface VisualState {
  value: number;
  secondValue: number | null;
  min: number;
  max: number;
  step: number;
  pressed?: boolean;
  activeHandle?: string | null;
}

/** Decorative tracks and ticks. Handles and controller retain interaction ownership. */
export const withTracks = (config: SliderConfig) => (component) => {
  const container: HTMLElement = component.container;
  const element = (name: string, parent: HTMLElement) => {
    const node = document.createElement("div");
    node.className = component.getClass(`slider-${name}`);
    parent.append(node);
    return node;
  };
  const visual = element("visual", container);
  visual.setAttribute("aria-hidden", "true");
  const track = element("track", visual);
  const segments = Array.from({ length: 3 }, () => element("segment", track));
  const ticks = [element("ticks", visual), element("ticks", visual)];
  ticks[1].classList.add(component.getClass("slider-ticks--active"));
  const dot = element("dot", visual);
  let destroyed = false;
  let size = config.size ?? "XS";
  let state: VisualState = {
    value: config.value ?? 0, secondValue: config.secondValue ?? null,
    min: config.min ?? 0, max: config.max ?? 100, step: config.step ?? 1,
  };

  const render = (next?: VisualState) => {
    if (destroyed) return;
    if (next) state = { ...next };
    const width = container.getBoundingClientRect().width || 200;
    const height = getTrackHeight(size);
    const edge = SLIDER_MEASUREMENTS.EDGE_PADDING;
    const position = (value: number) => edge + Math.min(1, Math.max(0,
      state.max === state.min ? 0 : (value - state.min) / (state.max - state.min),
    )) * Math.max(0, width - 2 * edge);
    const first = position(state.value);
    const second = position(state.secondValue ?? state.max);
    const zero = position(0);
    const gap = SLIDER_MEASUREMENTS.HANDLE_GAP;
    const reduction = SLIDER_MEASUREMENTS.HANDLE_GAP_PRESSED_REDUCTION;
    const firstGap = gap - (state.pressed && (!config.range || state.activeHandle === "first") ? reduction : 0);
    const secondGap = gap - (state.pressed && state.activeHandle === "second" ? reduction : 0);
    // Endpoints are shared with handles; CSS does the interpolation between updates.
    const parts: [number, number, boolean][] = [];
    let activeStart = 0, activeEnd = first;
    if (config.centered) {
      activeStart = Math.min(zero, first);
      activeEnd = Math.max(zero, first);
      const centerGap = SLIDER_MEASUREMENTS.CENTER_GAP / 2;
      if (Math.abs(first - zero) < firstGap) {
        parts.push([0, first - firstGap, false], [zero, zero, true], [first + firstGap, width, false]);
      } else if (state.value >= 0) {
        parts.push([0, zero - centerGap, false], [zero + centerGap, first - firstGap, true], [first + firstGap, width, false]);
      } else {
        parts.push([0, first - firstGap, false], [first + firstGap, zero - centerGap, true], [zero + centerGap, width, false]);
      }
    } else if (config.range && state.secondValue !== null) {
      activeStart = Math.min(first, second);
      activeEnd = Math.max(first, second);
      const lowGap = first <= second ? firstGap : secondGap;
      const highGap = first <= second ? secondGap : firstGap;
      const start = activeStart + lowGap, end = activeEnd - highGap;
      parts.push([0, activeStart - lowGap, false], [start, end - start > height ? end : start, true], [activeEnd + highGap, width, false]);
    } else {
      parts.push([0, 0, false], [0, first - firstGap, true], [first + firstGap, width, false]);
    }
    segments.forEach((segment, index) => {
      const [start, end, active] = parts[index] ?? [0, 0, false];
      segment.style.left = `${start}px`;
      segment.style.width = `${Math.max(0, end - start)}px`;
      segment.classList.toggle(component.getClass("slider-segment--active"), active);
    });
    const discrete = !!config.ticks && state.step > 0 && state.max > state.min;
    ticks.forEach(tick => { tick.hidden = !discrete; });
    dot.hidden = !!config.ticks;
    if (discrete) {
      const spacing = (width - 2 * edge) * state.step / (state.max - state.min);
      const last = position(state.min + Math.floor((state.max - state.min) / state.step) * state.step);
      const holes = [state.value, ...(config.range && state.secondValue !== null ? [state.secondValue] : [])]
        .filter(value => Math.abs((value - state.min) / state.step - Math.round((value - state.min) / state.step)) < 0.1)
        .map(value => position(state.min + Math.round((value - state.min) / state.step) * state.step))
        .sort((a, b) => a - b);
      const mask = (intervals: number[][]) => {
        const merged: number[][] = [];
        for (const [start, end] of intervals.sort((a, b) => a[0] - b[0])) {
          const previous = merged[merged.length - 1];
          if (previous && start <= previous[1]) previous[1] = Math.max(previous[1], end);
          else merged.push([start, end]);
        }
        const stops = merged.flatMap(([start, end]) => [`black ${start}px`, `transparent ${start}px`, `transparent ${end}px`, `black ${end}px`]);
        return stops.length ? `linear-gradient(to right, black 0px, ${stops.join(",")}, black 100%)` : "none";
      };
      ticks.forEach((tick, index) => {
        tick.style.backgroundSize = `${Math.max(spacing, 0.01)}px 100%`;
        tick.style.backgroundPosition = `${edge - spacing / 2}px center`;
        tick.style.maskImage = mask([
          ...holes.map(x => [x - 2, x + 2]),
          ...(index === 0 ? [[activeStart - 2, activeEnd + 2]] : []),
        ]);
      });
      ticks[0].style.clipPath = `inset(0 ${Math.max(0, width - last - 2)}px 0 0)`;
      ticks[1].style.clipPath = `inset(0 ${Math.max(0, width - Math.min(last + 2, activeEnd + 2))}px 0 ${Math.max(0, activeStart - 2)}px)`;
    }
  };
  const setSize = (next: SliderSize) => {
    if (destroyed) return;
    size = next;
    const handleHeight = getHandleHeight(size);
    container.style.height = `${Math.max(handleHeight, SLIDER_MEASUREMENTS.MIN_HEIGHT)}px`;
    track.style.height = `${getTrackHeight(size)}px`;
    track.style.borderRadius = `${getExternalTrackRadius(size)}px`;
    for (const handle of [component.handle, component.secondHandle]) {
      if (handle) handle.style.height = `${handleHeight}px`;
    }
    render();
  };
  component.renderTracks = render;
  component.setSize = setSize;
  component.getSize = () => size;
  const setColor = component.appearance.setColor;
  component.appearance.setColor = (color: SliderColor) => {
    if (destroyed) return;
    setColor.call(component.appearance, color);
    config.color = color;
  };
  setSize(size);
  const resize = () => { if (!destroyed) render(); };
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  if (observer) observer.observe(container);
  else window.addEventListener("resize", resize);
  const destroy = component.lifecycle.destroy;
  component.lifecycle.destroy = () => {
    if (destroyed) return;
    destroyed = true;
    observer?.disconnect();
    if (!observer) window.removeEventListener("resize", resize);
    destroy.call(component.lifecycle);
  };
  return component;
};
