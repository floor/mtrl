// src/components/sheet/sheet.ts
import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import {
  withEvents,
  withVariant,
  withLifecycle,
} from "../../core/compose/features";
import {
  withContent,
  withTitle,
  withPosition,
  withState,
  withGestures as sheetWithGestures,
} from "./features";
import { withAPI } from "./api";
import { SheetConfig } from "./types";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";

/**
 * Creates a new Sheet component
 * @param {SheetConfig} config - Sheet configuration object
 * @returns {SheetComponent} Sheet component instance
 */
const createSheet = (config: SheetConfig = {}) => {
  const baseConfig = createBaseConfig(config);

  try {
    const sheet = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withPosition(baseConfig),
      withContent(baseConfig),
      withTitle(baseConfig),
      withState(baseConfig),
      sheetWithGestures(baseConfig),
      withLifecycle(),
      (comp) => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    // Initialize the sheet (create DOM structure, add event listeners)
    sheet.initialize();

    return sheet;
  } catch (error) {
    console.error("Sheet creation error:", error);
    throw new Error(`Failed to create sheet: ${(error as Error).message}`);
  }
};

export default createSheet;
