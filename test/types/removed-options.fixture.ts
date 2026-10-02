// test/types/removed-options.fixture.ts
//
// PR D: the deprecated members 0.10 promised to remove in 1.0 are gone from
// the types, so a 0.10 option is a compile error where it is written.
import type { CreateElementOptions } from "../../src/core/dom";
import type { BaseComponentConfig } from "../../src/core/config/component";
import type { DialogButton } from "../../src/components/dialog/types";
import type { TooltipConfig } from "../../src/components/tooltip";
import { TOOLTIP_DEFAULTS } from "../../src/components/tooltip/constants";

// @ts-expect-error rawClass: use class or className (unprefixed since FLO-117)
export const element: CreateElementOptions = { rawClass: "x" };
// @ts-expect-error rawClass: use class or className
export const config: BaseComponentConfig = { rawClass: "x" };
// @ts-expect-error a dialog button has no color option (FLO-324)
export const button: DialogButton = { text: "OK", color: "primary" };
// @ts-expect-error a rich tooltip is variant: 'rich' (FLO-324)
export const tooltip: TooltipConfig = { text: "Hi", rich: true };
// @ts-expect-error TOOLTIP_DEFAULTS.RICH was the default of the removed option
export const richDefault = TOOLTIP_DEFAULTS.RICH;

// Commit 2: rippleConfig's timing and opacity were never applied (FLO-268)
import type { ButtonConfig } from "../../src/components/button/types";
import type { RippleConfig } from "../../src/core/compose/features/ripple";
// @ts-expect-error rippleConfig.timing: the stylesheet draws the wave's motion
export const buttonRipple: ButtonConfig = { rippleConfig: { duration: 300, timing: "linear" } };
// @ts-expect-error opacity: the wave is the pressed state layer, drawn by the stylesheet
export const coreRipple: RippleConfig = { duration: 300, opacity: ["0.4", "0"] };

// Options that never had an effect (deprecated in v0.10.0)
import type { CheckboxConfig } from "../../src/components/checkbox/types";
import type { ListConfig } from "../../src/components/list/types";
import type { RadiosConfig } from "../../src/components/radios/types";
import type { TimePickerConfig } from "../../src/components/timepicker/types";
import { TIMEPICKER_DEFAULTS } from "../../src/components/timepicker/constants";
// @ts-expect-error checkbox variant: M3 has one checkbox style (FLO-94, FLO-265)
export const checkboxVariant: CheckboxConfig = { variant: "filled" };
// @ts-expect-error list prefix: fixed at build time (FLO-118)
export const listPrefix: ListConfig = { items: [], prefix: "x" };
// @ts-expect-error radios rippleConfig: never applied (FLO-266)
export const radiosRipple: RadiosConfig = { name: "r", options: [], rippleConfig: { duration: 300 } };
// @ts-expect-error closeOnSelect: the time picker is confirmed with OK (FLO-281)
export const timeClose: TimePickerConfig = { closeOnSelect: false };
// @ts-expect-error CLOSE_ON_SELECT was the removed option's default
export const timeCloseDefault = TIMEPICKER_DEFAULTS.CLOSE_ON_SELECT;
import type { ResponsiveConfig } from "../../src/components/tabs";
// @ts-expect-error maxVisibleTabs: never had an effect (FLO-232)
export const tabsMax: ResponsiveConfig = { smallScreen: { layout: "icon-only", maxVisibleTabs: 4 } };

// Constant properties nothing read (deprecated in v0.10.0)
import { SLIDER_MEASUREMENTS } from "../../src/components/slider/constants";
import { TABS_DEFAULTS } from "../../src/components/tabs/constants";
import { TEXT_FIELD_CLASSES } from "../../src/components/textfield/constants";
import { TIMEPICKER_SELECTORS } from "../../src/components/timepicker/constants";
// @ts-expect-error the stylesheet draws the track's corners (FLO-250)
export const sliderRadius = SLIDER_MEASUREMENTS.TRACK_RADIUS;
// @ts-expect-error the gap does not shrink (FLO-250)
export const sliderGap = SLIDER_MEASUREMENTS.HANDLE_GAP_PRESSED_REDUCTION;
// @ts-expect-error the indicator height follows the variant (FLO-262)
export const tabsIndicatorHeight = TABS_DEFAULTS.INDICATOR_HEIGHT;
// @ts-expect-error the stylesheet sets the icon size
export const tabsIconSize = TABS_DEFAULTS.ICON_SIZE;
// @ts-expect-error a floating label is the field's populated or focused state (FLO-295)
export const labelFloating = TEXT_FIELD_CLASSES.LABEL_FLOATING;
// @ts-expect-error the dial is DOM, not a canvas (FLO-279)
export const dialCanvas = TIMEPICKER_SELECTORS.DIAL_CANVAS;

// The FAB's surface style and small size, deprecated since 0.8 (M3 Expressive)
import type { FabVariant, FabSize } from "../../src/components/fab/types";
import type { ExtendedFabVariant } from "../../src/components/extended-fab/types";
import { FAB_SIZES, FAB_VARIANTS } from "../../src/components/fab/constants";
// The options take any string; their named unions no longer list the removed values
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
export const noSurface: Equals<Extract<FabVariant | ExtendedFabVariant, "surface">, never> = true;
export const noSmall: Equals<Extract<FabSize, "small">, never> = true;
// @ts-expect-error FAB_SIZES.SMALL is gone with the size
export const fabSmallKey = FAB_SIZES.SMALL;
// @ts-expect-error FAB_VARIANTS.SURFACE is gone with the style
export const fabSurfaceKey = FAB_VARIANTS.SURFACE;

// Renamed members whose new names 0.10 already had
import type { ChipConfig } from "../../src/components/chips/types";
import type { TabsConfig } from "../../src/components/tabs/types";
// @ts-expect-error a chip's text is its label
export const chipText: ChipConfig = { text: "Veg" };
// @ts-expect-error indicatorHeight is indicator.height
export const tabsHeight: TabsConfig = { indicatorHeight: 3 };
// @ts-expect-error indicatorWidthStrategy is indicator.widthStrategy
export const tabsWidth: TabsConfig = { indicatorWidthStrategy: "fixed" };

// Deprecated in 0.10.5 (#439): constants no option reads, and a removed option's type
import { DEFAULT_RIPPLE_CONFIG } from "../../src/components/button/constants";
import { DEFAULT_RIPPLE_CONFIG as ICON_BUTTON_RIPPLE } from "../../src/components/icon-button/constants";
import { BUTTON_GROUP_DEFAULTS } from "../../src/components/button-group/constants";
import { FAB_CLASSES, FAB_ICON_SIZES } from "../../src/components/fab/constants";
// @ts-expect-error DEFAULT_RIPPLE_CONFIG.TIMING: rippleConfig.timing is gone
export const buttonRippleTiming = DEFAULT_RIPPLE_CONFIG.TIMING;
// @ts-expect-error DEFAULT_RIPPLE_CONFIG.OPACITY: rippleConfig.opacity is gone
export const iconButtonRippleOpacity = ICON_BUTTON_RIPPLE.OPACITY;
// @ts-expect-error BUTTON_GROUP_DEFAULTS.RIPPLE_TIMING: rippleConfig.timing is gone
export const groupRippleTiming = BUTTON_GROUP_DEFAULTS.RIPPLE_TIMING;
// @ts-expect-error BUTTON_GROUP_DEFAULTS.RIPPLE_OPACITY: rippleConfig.opacity is gone
export const groupRippleOpacity = BUTTON_GROUP_DEFAULTS.RIPPLE_OPACITY;
// @ts-expect-error FAB_CLASSES.SMALL is gone with the small size
export const fabSmallClass = FAB_CLASSES.SMALL;
// @ts-expect-error FAB_ICON_SIZES.SMALL is gone with the small size
export const fabSmallIcon = FAB_ICON_SIZES.SMALL;
// @ts-expect-error CheckboxVariant was the type of the removed variant option
import type { CheckboxVariant } from "../../src/components/checkbox";
export type OldCheckboxVariant = CheckboxVariant;

// RADIO_DEFAULTS described options the radios never had (deprecated on 0.10.x, #454)
import { RADIO_DEFAULTS } from "../../src/components/radios/constants";
// @ts-expect-error RADIO_DEFAULTS.VARIANT: the radios have no variant option
export const radioDefaultVariant = RADIO_DEFAULTS.VARIANT;
// @ts-expect-error RADIO_DEFAULTS.LABEL_POSITION: the radios have no label position option
export const radioDefaultLabel = RADIO_DEFAULTS.LABEL_POSITION;
// @ts-expect-error RADIO_DEFAULTS.SIZE: the radios have no size option
export const radioDefaultSize = RADIO_DEFAULTS.SIZE;
export const radioDefaultDirection: "vertical" = RADIO_DEFAULTS.DIRECTION;
