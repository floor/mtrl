// src/components/bottom-sheet/config.ts

import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { BottomSheetConfig } from "./types";
import {
  BOTTOM_SHEET_DEFAULTS,
  BOTTOM_SHEET_STATES,
} from "./constants";

/**
 * What the component applies when the caller says nothing.
 */
export const defaultConfig: Partial<BottomSheetConfig> = {
  variant: BOTTOM_SHEET_DEFAULTS.VARIANT,
  dragHandle: BOTTOM_SHEET_DEFAULTS.DRAG_HANDLE,
  peekHeight: BOTTOM_SHEET_DEFAULTS.PEEK_HEIGHT,
  maxWidth: BOTTOM_SHEET_DEFAULTS.MAX_WIDTH,
  initialState: BOTTOM_SHEET_STATES.HIDDEN,
  closeOnScrimClick: BOTTOM_SHEET_DEFAULTS.CLOSE_ON_SCRIM_CLICK,
  closeOnEscape: BOTTOM_SHEET_DEFAULTS.CLOSE_ON_ESCAPE,
};

/**
 * Merges the caller's configuration over the defaults.
 */
export const createBaseConfig = (
  config: BottomSheetConfig = {}
): BottomSheetConfig =>
  createComponentConfig(
    defaultConfig,
    config,
    "bottom-sheet"
  ) as BottomSheetConfig;

/**
 * The root element: a fixed layer holding the scrim and the sheet itself.
 */
export const getElementConfig = (config: BottomSheetConfig) =>
  createElementConfig(config, {
    tag: "div",
    className: [config.class].filter(Boolean),
    attributes: {
      // hidden until it opens, so nothing in it is reachable meanwhile
      "aria-hidden": "true",
    },
  });
