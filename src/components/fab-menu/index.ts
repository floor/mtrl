// src/components/fab-menu/index.ts

import createFabMenu from "./fab-menu";

export default createFabMenu;
export { createFabMenu };
export {
  FAB_MENU_COLORS,
  FAB_MENU_SIZES,
  FAB_MENU_PRESENTATIONS,
  FAB_MENU_PLACEMENTS,
  FAB_MENU_EVENTS,
} from "./constants";
export type { FabMenuColor, FabMenuSize, FabMenuPresentation, FabMenuPlacement } from "./constants";
export type { FabMenuConfig, FabMenuComponent, FabMenuEvents, FabMenuItem, FabMenuMenu } from "./types";
export * from "./constants";
