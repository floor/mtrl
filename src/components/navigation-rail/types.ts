import type { BaseComponentConfig } from '../../core/config/component';
/** A primary destination. Icons are trusted SVG/HTML supplied by the application. */
export interface NavigationRailItemConfig {
    id: string;
    label: string;
    icon: string;
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
    /** Menu button icon while collapsed. Default: Material Symbols `menu`. */
    expandIcon?: string;
    /** Menu button icon while expanded. Default: Material Symbols `menu_open`. */
    collapseIcon?: string;
    /** Optional application-owned header, such as a FAB. Its lifecycle stays with its owner. */
    header?: HTMLElement;
    ripple?: boolean;
    onSelect?: (event: NavigationRailSelectEvent) => void;
    onExpand?: () => void;
    onCollapse?: () => void;
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
