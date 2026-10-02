// src/components/navigation-bar/types.ts
import type { DestinationConfig } from '../../core/navigation/destinations';

/** One destination of the bar: a link (`href`) or a button. */
export type NavigationBarItemConfig = DestinationConfig;

/** What `select` and `onSelect` carry: the destination chosen by click or keyboard. */
export interface NavigationBarSelectEvent {
    id: string;
    /** The id, as `<m-navigation-bar>`'s `change` carries it */
    value: string;
    index: number;
    originalEvent: MouseEvent;
}

export interface NavigationBarEvents {
    select: NavigationBarSelectEvent;
    /** The bar was hidden (`hidden: true`) or shown again, by scroll or by `hide()`/`show()` */
    visibility: { hidden: boolean };
}

/**
 * Where an item puts its icon. `'vertical'`: above the label, the compact bar.
 * `'horizontal'`: beside it, M3 Expressive's medium-width bar, with the items
 * centred. `'auto'` (the default) is vertical, and horizontal while the bar
 * itself is at least 600px wide: a CSS container query on the bar, so a bar in
 * a narrow pane stays vertical in a wide window. Compose leaves the choice to
 * the caller; MDC-Android puts the threshold at 600dp.
 */
export type NavigationBarItemLayout = 'auto' | 'vertical' | 'horizontal';

export interface NavigationBarConfig {
    /** Three to five destinations (M3) */
    items?: NavigationBarItemConfig[];
    itemLayout?: NavigationBarItemLayout;
    /**
     * Hides the bar while the page scrolls down and shows it when it scrolls
     * up, as the bottom app bar's `autoHide`. `true` follows the window; pass an
     * element to follow its scroll instead. Off by default: M3's guidelines
     * advise against hiding navigation while a screen reader is in use, which a
     * page can't detect. Focus inside the bar always shows it.
     */
    hideOnScroll?: boolean | { target?: HTMLElement | Window };
    /** The landmark's name; default "Primary navigation" */
    ariaLabel?: string;
    ripple?: boolean;
    /** `select` listener registered at creation. */
    onSelect?: (event: NavigationBarEvents["select"]) => void;
    class?: string;
    prefix?: string;
    componentName?: string;
}

export interface NavigationBarComponent {
    element: HTMLElement;
    getClass: (name: string) => string;
    lifecycle: { destroy: () => void };
    getActive: () => string | null;
    /** The active destination's id, as getActive(): the value getter every component has (FLO-380) */
    getValue: () => string | null;
    /** Marks a destination active, silently (no `select`); `null` clears it */
    setActive: (id: string | null) => NavigationBarComponent;
    getItems: () => NavigationBarItemConfig[];
    setItems: (items: NavigationBarItemConfig[]) => NavigationBarComponent;
    setBadge: (id: string, badge: NavigationBarItemConfig['badge'], label?: string) => NavigationBarComponent;
    /** Slides the bar out of view (without the slide under reduced motion) */
    hide: () => NavigationBarComponent;
    show: () => NavigationBarComponent;
    isHidden: () => boolean;
    on: <K extends keyof NavigationBarEvents>(event: K, handler: (payload: NavigationBarEvents[K]) => void) => NavigationBarComponent;
    off: <K extends keyof NavigationBarEvents>(event: K, handler: (payload: NavigationBarEvents[K]) => void) => NavigationBarComponent;
    destroy: () => void;
}
