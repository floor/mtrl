import type { BaseComponentConfig } from '../../core/config/component';
/** A primary destination. Icons are markup supplied by the application. */
export interface NavigationRailItemConfig {
    id: string;
    label: string;
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: string;
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. Shown while this destination is active. */
    activeIcon?: string;
    href?: string;
    badge?: string | number | boolean;
    /** Accessible description for a dot badge or count, e.g. "3 unread messages". */
    badgeLabel?: string;
    active?: boolean;
    disabled?: boolean;
}
export interface NavigationRailSelectEvent {
    id: string;
    /** The id again, as the `value` of the `<m-navigation-rail>` element's `change` (FLO-320) */
    value: string;
    index: number;
    originalEvent: MouseEvent;
}
export interface NavigationRailEvents {
    select: NavigationRailSelectEvent;
    expand: {
        expanded: true;
    };
    collapse: {
        expanded: false;
    };
}
/** Standalone, non-modal M3 Expressive navigation rail. */
export interface NavigationRailConfig extends BaseComponentConfig {
    items?: NavigationRailItemConfig[];
    expanded?: boolean;
    /** Standard rail occupies layout space; modal expansion uses a native modal dialog. */
    layout?: 'standard' | 'modal';
    /** Hide the standard rail when collapsed. Modal rails always hide when collapsed. */
    hideWhenCollapsed?: boolean;
    /** Expanded width in CSS pixels, clamped to the Android token range 220–360. Default 280. */
    expandedWidth?: number;
    /** Show the accessible expand/collapse menu button. Default true. */
    showToggle?: boolean;
    expandLabel?: string;
    collapseLabel?: string;
    /** Menu button icon while collapsed. Default: Material Symbols `menu`. Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    expandIcon?: string;
    /** Menu button icon while expanded. Default: Material Symbols `menu_open`. Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    collapseIcon?: string;
    /** Optional application-owned header, such as a FAB. Its lifecycle stays with its owner. */
    header?: HTMLElement;
    ripple?: boolean;
    /** `select` listener registered at creation. */
    onSelect?: (event: NavigationRailEvents["select"]) => void;
    /** `expand` listener registered at creation. The argument is `{ expanded: true }`. */
    onExpand?: (event: NavigationRailEvents["expand"]) => void;
    /** `collapse` listener registered at creation. The argument is `{ expanded: false }`. */
    onCollapse?: (event: NavigationRailEvents["collapse"]) => void;
}
export interface NavigationRailComponent {
    element: HTMLElement;
    getClass: (name: string) => string;
    expand: () => NavigationRailComponent;
    collapse: () => NavigationRailComponent;
    toggle: () => NavigationRailComponent;
    isExpanded: () => boolean;
    setActive: (id: string | null) => NavigationRailComponent;
    getActive: () => string | null;
    /** Reads the current model value without changing selection. */
    getValue: () => string | null;
    setItems: (items: NavigationRailItemConfig[]) => NavigationRailComponent;
    getItems: () => NavigationRailItemConfig[];
    setBadge: (id: string, badge: NavigationRailItemConfig['badge'], label?: string) => NavigationRailComponent;
    on: <K extends keyof NavigationRailEvents>(event: K, handler: (detail: NavigationRailEvents[K]) => void) => NavigationRailComponent;
    off: <K extends keyof NavigationRailEvents>(event: K, handler: (detail: NavigationRailEvents[K]) => void) => NavigationRailComponent;
    destroy: () => void;
    lifecycle: {
        destroy: () => void;
    };
}


/**
 * Registers NavigationRailConfig with the global defaults map, so
 * `setComponentDefaults("navigation-rail", ...)` is typed without core
 * importing anything from this component. FLO-115.
 */
declare module "../../core/config/global" {
  interface ComponentConfigMap {
    "navigation-rail"?: Partial<NavigationRailConfig>;
  }
}
