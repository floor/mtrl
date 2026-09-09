// src/components/side-sheet/config.ts

import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { SideSheetConfig } from "./types";
import { SIDE_SHEET_DEFAULTS } from "./constants";

/**
 * What the component applies when the caller says nothing.
 */
export const defaultConfig: Partial<SideSheetConfig> = {
  variant: SIDE_SHEET_DEFAULTS.VARIANT,
  position: SIDE_SHEET_DEFAULTS.POSITION,
  width: SIDE_SHEET_DEFAULTS.WIDTH,
  maxWidth: SIDE_SHEET_DEFAULTS.MAX_WIDTH,
  closeButton: SIDE_SHEET_DEFAULTS.CLOSE_BUTTON,
  closeOnScrimClick: SIDE_SHEET_DEFAULTS.CLOSE_ON_SCRIM_CLICK,
  closeOnEscape: SIDE_SHEET_DEFAULTS.CLOSE_ON_ESCAPE,
  open: false,
};

/**
 * Merges the caller's configuration over the defaults.
 */
export const createBaseConfig = (config: SideSheetConfig = {}): SideSheetConfig =>
  createComponentConfig(defaultConfig, config, "side-sheet") as SideSheetConfig;

/**
 * The root element: a fixed layer holding the scrim and the sheet itself.
 */
export const getElementConfig = (config: SideSheetConfig) =>
  createElementConfig(config, {
    tag: "div",
    className: [config.class].filter(Boolean),
    attributes: {
      "aria-hidden": "true",
    },
  });
