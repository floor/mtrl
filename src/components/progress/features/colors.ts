// src/components/progress/features/colors.ts
//
// The indicator's colours, read once and kept. Every frame used to resolve
// four theme colours, and each of those ran getComputedStyle on the body: at
// 60fps, with a few indicators on the page, that is a lot of style
// recalculation for values that only change with the theme.

import { getThemeColor } from "../../../core/utils";
import { onThemeChange } from "../../../core/utils/theme";
import { PROGRESS_COLORS } from "../constants";

export interface ProgressColors {
  indicator: string;
  track: string;
  stop: string;
  buffer: string;
}

const FALLBACKS: ProgressColors = {
  indicator: "#6750A4",
  track: "#E8DEF8",
  stop: "#6750A4",
  buffer: "#EADDFF",
};

const read = (): ProgressColors => ({
  indicator: getThemeColor(PROGRESS_COLORS.INDICATOR, { fallback: FALLBACKS.indicator }),
  track: getThemeColor(PROGRESS_COLORS.TRACK, { fallback: FALLBACKS.track }),
  stop: getThemeColor(PROGRESS_COLORS.STOP, { fallback: FALLBACKS.stop }),
  buffer: getThemeColor(PROGRESS_COLORS.BUFFER, { fallback: FALLBACKS.buffer }),
});

/**
 * Keeps the palette for one indicator, refreshed when the theme changes.
 * @param onChange - called after the colours change, to redraw
 * @returns the palette getter and a cleanup function
 */
export const createColors = (
  onChange: () => void
): { get: () => ProgressColors; refresh: () => void; destroy: () => void } => {
  let colors = FALLBACKS;
  let read_ = false;

  const refresh = (): void => {
    try {
      colors = read();
      read_ = true;
    } catch {
      // No document to read from: the fallbacks stand
    }
  };

  const offThemeChange = onThemeChange(() => {
    refresh();
    onChange();
  });

  return {
    get: (): ProgressColors => {
      if (!read_) refresh();
      return colors;
    },
    refresh,
    destroy: offThemeChange,
  };
};
