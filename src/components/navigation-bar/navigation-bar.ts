// src/components/navigation-bar/navigation-bar.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose/pipe';
import { createBase, withElement } from '../../core/compose/component';
import { withLifecycle } from '../../core/compose/features/lifecycle';
import { createElementConfig } from '../../core/config/component';
import { createEmitter } from '../../core/state/emitter';
import { activeElementOf } from '../../core/dom/focus';
import { mountRailRipple } from '../../core/navigation/ripple';
import {
    copyDestinations, createDestination, moveDestinationFocus, updateBadge, updateSelection,
} from '../../core/navigation/destinations';
import { createBaseConfig } from './config';
import type { NavigationBarComponent, NavigationBarConfig, NavigationBarItemConfig } from './types';

/** How far the page scrolls one way before the bar hides or comes back, as the bottom app bar's */
const SCROLL_THRESHOLD = 10;

/**
 * Creates an M3 Expressive navigation bar: three to five destinations along
 * the bottom of a compact or medium window (Compose `ShortNavigationBar`).
 * Import its styles separately with `mtrl/styles/navigation-bar`. Links keep
 * native browser navigation; `onSelect` can `preventDefault()` for a router.
 * Don't show it together with a toolbar (m3.material.io).
 */
export default function createNavigationBar(config: NavigationBarConfig = {}): NavigationBarComponent {
    const options = createBaseConfig(config);
    let items = copyDestinations(options.items || [], 'NavigationBar');
    const component = pipe(
        createBase,
        withElement(createElementConfig(options, { tag: 'nav', attributes: { 'aria-label': options.ariaLabel || 'Primary navigation' } })),
        withLifecycle(),
    )(options);
    const root: HTMLElement = component.element;
    const getClass: (name: string) => string = component.getClass;
    const cls = (part: string): string => getClass(`navigation-bar${part}`);
    const emitter = createEmitter();
    let destroyed = false;
    let hidden = false;

    // The item layout's modifier, written as cls() literals as the rail's
    root.classList.add(options.itemLayout === 'vertical' ? cls('--vertical') : options.itemLayout === 'horizontal' ? cls('--horizontal') : cls('--auto'));
    const nodes = new Map<string, HTMLElement>();
    const destinations = document.createElement('div');
    destinations.className = cls('__items');
    root.append(destinations);

    const render = (): void => {
        const focusedId = [...nodes].find(([, element]) => element === activeElementOf(destinations))?.[0];
        nodes.clear();
        destinations.replaceChildren();
        for (const item of items) {
            const element = createDestination(item, cls);
            nodes.set(item.id, element);
            destinations.append(element);
        }
        updateSelection(items, nodes, cls);
        // The centred arrangement of horizontal items depends on how many there are
        root.style.setProperty(`--${PREFIX}-navigation-bar-count`, String(items.length));
        if (focusedId) {
            const previous = nodes.get(focusedId);
            const target = previous && !previous.hasAttribute('aria-disabled') ? previous : [...nodes.values()].find((element) => !element.hasAttribute('aria-disabled'));
            target?.focus();
        }
    };

    const setHidden = (value: boolean): void => {
        if (destroyed || hidden === value) return;
        hidden = value;
        root.classList.toggle(cls('--hidden'), value);
        emitter.emit('visibility', { hidden: value });
    };

    const handleClick = (event: MouseEvent): void => {
        if (destroyed || event.defaultPrevented) return;
        const element = (event.target as Element).closest<HTMLElement>(`.${cls('__item')}`);
        if (!element || !destinations.contains(element)) return;
        const index = items.findIndex((item) => nodes.get(item.id) === element), item = items[index];
        if (!item || item.disabled) {
            event.preventDefault();
            return;
        }
        if (item.href && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)) return;
        api.setActive(item.id);
        const detail = { id: item.id, value: item.id, index, originalEvent: event };
        emitter.emit('select', detail);
    };

    // Left and right along the bar, mirrored under RTL; direction read when the key is pressed
    const handleKeydown = (event: KeyboardEvent): void => {
        const rtl = getComputedStyle(root).direction === 'rtl';
        moveDestinationFocus(event, nodes, destinations, rtl ? { next: 'ArrowLeft', previous: 'ArrowRight' } : { next: 'ArrowRight', previous: 'ArrowLeft' });
    };

    // A hidden bar comes back when something in it takes focus: a keyboard user is never left on an invisible item
    const handleFocus = (): void => setHidden(false);

    // Hide on scroll: nothing is read until the first scroll event, so construction stays free of layout reads
    const scrollOption = options.hideOnScroll;
    const scrollTarget: HTMLElement | Window | null = scrollOption
        ? (typeof scrollOption === 'object' && scrollOption.target) || window
        : null;
    let lastScroll: number | null = null;
    const scrollPosition = (): number => (scrollTarget === window ? window.scrollY : (scrollTarget as HTMLElement).scrollTop);
    const handleScroll = (): void => {
        const current = scrollPosition();
        if (lastScroll === null) {
            lastScroll = current;
            return;
        }
        if (current > lastScroll + SCROLL_THRESHOLD) setHidden(true);
        else if (current < lastScroll - SCROLL_THRESHOLD) setHidden(false);
        else return;
        lastScroll = current;
    };

    root.addEventListener('click', handleClick);
    destinations.addEventListener('keydown', handleKeydown);
    root.addEventListener('focusin', handleFocus);
    scrollTarget?.addEventListener('scroll', handleScroll, { passive: true });
    const removeRipple = options.ripple ? mountRailRipple(root, cls) : undefined;

    const originalDestroy = component.lifecycle.destroy.bind(component.lifecycle);
    const destroy = (): void => {
        if (destroyed) return;
        destroyed = true;
        root.removeEventListener('click', handleClick);
        destinations.removeEventListener('keydown', handleKeydown);
        root.removeEventListener('focusin', handleFocus);
        scrollTarget?.removeEventListener('scroll', handleScroll);
        removeRipple?.();
        nodes.clear();
        emitter.clear();
        originalDestroy();
    };
    component.lifecycle.destroy = destroy;

    const api: NavigationBarComponent = {
        element: root, getClass, lifecycle: component.lifecycle, destroy,
        getActive: () => items.find((item) => item.active)?.id || null,
        getValue: () => api.getActive(),
        setActive(id) {
            if (destroyed || (id !== null && !items.some((item) => item.id === id && !item.disabled))) return api;
            items = items.map((item) => ({ ...item, active: item.id === id }));
            updateSelection(items, nodes, cls);
            return api;
        },
        getItems: () => items.map((item) => ({ ...item })),
        setItems(value: NavigationBarItemConfig[]) {
            if (!destroyed) {
                items = copyDestinations(value, 'NavigationBar');
                render();
            }
            return api;
        },
        setBadge(id, badge, label) {
            if (destroyed) return api;
            const item = items.find((entry) => entry.id === id);
            if (item) {
                item.badge = badge;
                item.badgeLabel = label;
                updateBadge(item, nodes.get(id)!, cls);
            }
            return api;
        },
        hide: () => { setHidden(true); return api; },
        show: () => { setHidden(false); return api; },
        isHidden: () => hidden,
        on(event, handler) { if (!destroyed) emitter.on(event, handler as never); return api; },
        off(event, handler) { emitter.off(event, handler as never); return api; },
    };
    render();
    // A config option is the listener registered at creation, ahead of any
    // listener the caller adds afterwards. A listener that destroys the bar
    // during emit no longer skips it: it has already run.
    if (options.onSelect) api.on('select', options.onSelect);
    return api;
}
