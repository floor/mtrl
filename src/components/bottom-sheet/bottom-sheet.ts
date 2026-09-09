// src/components/bottom-sheet/bottom-sheet.ts

import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import { withStructure, withState, withDrag } from "./features";
import { withAPI, applyEventHandlers } from "./api";
import { BottomSheetConfig, BottomSheetComponent } from "./types";
import { createBaseConfig, getElementConfig } from "./config";

/**
 * Creates a bottom sheet: a surface anchored to the bottom edge holding
 * content secondary to the page.
 *
 * A modal sheet covers the page with a scrim and takes focus, for a task that
 * must finish first. A standard sheet leaves the page usable alongside it.
 *
 * @param {BottomSheetConfig} config - Bottom sheet configuration
 * @returns {BottomSheetComponent} Bottom sheet instance
 *
 * @example
 * ```ts
 * const sheet = createBottomSheet({
 *   title: 'Share',
 *   content: '<p>Choose where to send it.</p>',
 *   on: { close: () => console.info('closed') }
 * });
 *
 * sheet.open();
 * ```
 */
const createBottomSheet = (
  config: BottomSheetConfig = {}
): BottomSheetComponent => {
  const baseConfig = createBaseConfig(config);

  const component = pipe(
    createBase,
    withEvents(),
    withElement(getElementConfig(baseConfig)),
    withStructure(baseConfig),
    withState(baseConfig),
    withDrag(baseConfig),
    // lifecycle before the API, so the API's destroy wraps a lifecycle that
    // exists. Composed the other way round, cleanup silently never runs.
    withLifecycle()
  )(baseConfig);

  applyEventHandlers(component, baseConfig.on);

  return withAPI({
    state: component.state,
    structure: component.structure,
    drag: component.drag,
    lifecycle: { destroy: component.lifecycle?.destroy ?? (() => {}) },
  })(component);
};

export default createBottomSheet;
