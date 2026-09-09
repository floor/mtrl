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

/** So the warning is said once per page, not once per sheet */
let deprecationAnnounced = false;

/**
 * Creates a new Sheet component
 *
 * @deprecated Since 0.8.0. Use {@link createBottomSheet} for a sheet anchored
 * to the bottom edge, or {@link createSideSheet} for one docked to a vertical
 * edge. Those follow the M3 bottom sheet and side sheet specifications, which
 * this component predates and does not match.
 *
 * This component is also broken: `open()`, `close()` and the drag gestures
 * call `component.events.emit(...)`, but it composes the event feature that
 * provides `emit` directly and no `events` object, so every one of them
 * throws. Its scrim is never inserted into the page either. It is kept only so
 * that existing imports keep resolving, and it will be removed.
 *
 * @param {SheetConfig} config - Sheet configuration object
 * @returns {SheetComponent} Sheet component instance
 */
const createSheet = (config: SheetConfig = {}) => {
  if (!deprecationAnnounced) {
    deprecationAnnounced = true;
    console.warn(
      "[mtrl] createSheet is deprecated and does not work: open() and close() throw. " +
        "Use createBottomSheet or createSideSheet instead."
    );
  }

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
