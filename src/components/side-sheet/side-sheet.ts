// src/components/side-sheet/side-sheet.ts

import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import { withStructure, withState } from "./features";
import { withAPI, applyEventHandlers } from "./api";
import { SideSheetConfig, SideSheetComponent } from "./types";
import { createBaseConfig, getElementConfig } from "./config";

/**
 * Creates a side sheet: a surface docked to a vertical edge, holding content
 * that supports the page rather than replacing it.
 *
 * A standard sheet sits beside the page and leaves it usable. A modal sheet
 * floats over it behind a scrim and takes focus.
 *
 * @param {SideSheetConfig} config - Side sheet configuration
 * @returns {SideSheetComponent} Side sheet instance
 *
 * @example
 * ```ts
 * const filters = createSideSheet({
 *   title: 'Filters',
 *   content: '<p>Narrow the results.</p>',
 *   on: { close: () => applyFilters() }
 * });
 *
 * filters.open();
 * ```
 */
const createSideSheet = (config: SideSheetConfig = {}): SideSheetComponent => {
  const baseConfig = createBaseConfig(config);

  const component = pipe(
    createBase,
    withEvents(),
    withElement(getElementConfig(baseConfig)),
    withStructure(baseConfig),
    withState(baseConfig),
    // lifecycle before the API, so its destroy wraps a lifecycle that exists
    withLifecycle()
  )(baseConfig);

  applyEventHandlers(component, baseConfig.on);

  return withAPI({
    state: component.state,
    structure: component.structure,
    lifecycle: { destroy: component.lifecycle?.destroy ?? (() => {}) },
  })(component);
};

export default createSideSheet;
