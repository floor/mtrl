import { pipe } from '../../core/compose/pipe';
import { createBase, withElement } from '../../core/compose/component';
import { withLifecycle } from '../../core/compose/features/lifecycle';
import { createElementConfig } from '../../core/config/component';
import { createEmitter } from '../../core/state/emitter';
import { mountRailRipple } from './ripple';
import { createBaseConfig } from './config';
import type { NavigationRailConfig, NavigationRailComponent, NavigationRailItemConfig } from './types';
const copyItems = (items: NavigationRailItemConfig[]): NavigationRailItemConfig[] => {
    const ids = new Set<string>();
    let selected = false;
    return items.map(item => {
        if (!item.id || !item.label || !item.icon || ids.has(item.id))
            throw new Error('NavigationRail destinations require unique IDs, labels, and icons');
        ids.add(item.id);
        const active = !!item.active && !item.disabled && !selected;
        selected ||= active;
        return { ...item, active };
    });
};
/**
 * Creates an M3 Expressive navigation rail with stable destinations during expansion.
 * Import its styles separately with `mtrl/styles/navigation-rail`.
 * Links retain native browser navigation; onSelect can preventDefault for a router.
 */
export default function createNavigationRail(config: NavigationRailConfig = {}): NavigationRailComponent {
    const options = createBaseConfig(config);
    let items = copyItems(options.items || []);
    const component = pipe(createBase, withElement(createElementConfig(options, { tag: options.layout === 'modal' ? 'dialog' : 'nav', attributes: { 'aria-label': options.ariaLabel || 'Primary navigation' } })), withLifecycle())(options);
    const root: HTMLElement = component.element;
    const getClass: (name: string) => string = component.getClass;
    const cls = (part: string): string => getClass(`navigation-rail${part}`);
    const emitter = createEmitter();
    let expanded = !!options.expanded;
    let destroyed = false;
    // While the rail changes width the label and badge fade out and back in
    // (the swap keyframes); the class lives for the spring's duration.
    let switching: ReturnType<typeof setTimeout> | null = null;
    const SWITCH_DURATION = 450;
    const endSwitch = (): void => {
        if (switching !== null) clearTimeout(switching);
        switching = null;
        root.classList.remove(cls('--switching'));
    };
    const startSwitch = (): void => {
        endSwitch();
        root.classList.add(cls('--switching'));
        switching = setTimeout(endSwitch, SWITCH_DURATION);
    };
    let connectionObserver: MutationObserver | null = null;
    const dialog = options.layout === 'modal' ? root as HTMLDialogElement : null;
    if (dialog)
        root.classList.add(cls('--modal'));
    if (options.hideWhenCollapsed)
        root.classList.add(cls('--hide-collapsed'));
    const nodes = new Map<string, HTMLElement>();
    const destinations = document.createElement('div');
    destinations.className = cls('__items');
    const header = document.createElement('div');
    header.className = cls('__header');
    let toggle: HTMLButtonElement | null = null;
    if (options.showToggle) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = cls('__toggle');
        header.append(toggle);
    }
    if (options.header)
        header.append(options.header);
    if (header.childElementCount)
        root.append(header);
    root.append(destinations);
    root.style.setProperty(`--${options.prefix}-navigation-rail-expanded-width`, `${options.expandedWidth}px`);
    const updateBadge = (item: NavigationRailItemConfig, element: HTMLElement): void => {
        let badge = element.querySelector<HTMLElement>(`.${cls('__badge')}`);
        const visible = item.badge !== undefined && item.badge !== false && item.badge !== '';
        if (!visible) {
            badge?.remove();
            element.classList.remove(cls('__item--badged'));
            element.setAttribute('aria-label', item.label);
            return;
        }
        if (!badge) {
            badge = document.createElement('span');
            badge.className = cls('__badge');
            badge.setAttribute('aria-hidden', 'true');
            element.querySelector(`.${cls("__content")}`)!.append(badge);
        }
        badge.classList.toggle(cls('__badge--dot'), item.badge === true);
        badge.textContent = item.badge === true ? '' : String(item.badge);
        element.classList.toggle(cls('__item--badged'), item.badge !== true);
        element.setAttribute('aria-label', `${item.label}, ${item.badgeLabel || (item.badge === true ? 'New activity' : String(item.badge))}`);
    };
    const updateSelection = (): void => {
        for (const item of items) {
            const element = nodes.get(item.id)!;
            element.classList.toggle(cls('__item--active'), !!item.active);
            if (item.active)
                element.setAttribute('aria-current', 'page');
            else
                element.removeAttribute('aria-current');
            const icon = element.querySelector<HTMLElement>(`.${cls('__icon')}`)!;
            icon.innerHTML = item.active && item.activeIcon ? item.activeIcon : item.icon;
        }
    };
    const render = (): void => {
        const focusedId = [...nodes].find(([, element]) => element === document.activeElement)?.[0];
        nodes.clear();
        destinations.replaceChildren();
        for (const item of items) {
            const element = document.createElement(item.href ? 'a' : 'button');
            if (item.href) {
                if (!item.disabled)
                    element.setAttribute("href", item.href);
                else {
                    element.setAttribute('role', 'link');
                    element.tabIndex = -1;
                }
            }
            else {
                element.setAttribute('type', 'button');
                if (item.disabled)
                    element.setAttribute('disabled', '');
            }
            if (item.disabled)
                element.setAttribute('aria-disabled', 'true');
            element.className = cls('__item');
            element.dataset.id = item.id;
            const indicator = document.createElement('span');
            indicator.className = cls('__indicator');
            indicator.setAttribute('aria-hidden', 'true');
            const icon = document.createElement('span');
            icon.className = cls('__icon');
            icon.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span');
            label.className = cls('__label');
            label.textContent = item.label;
            const content = document.createElement('span');
            content.className = cls('__content');
            content.append(indicator, icon, label);
            element.append(content);
            updateBadge(item, element);
            nodes.set(item.id, element);
            destinations.append(element);
        }
        updateSelection();
        if (focusedId) {
            const previous = nodes.get(focusedId);
            const target = previous && !previous.hasAttribute('aria-disabled') ? previous : [...nodes.values()].find(element => !element.hasAttribute('aria-disabled')) || toggle;
            target?.focus();
        }
    };
    const showModal = (): void => {
        if (!dialog || destroyed || !expanded)
            return;
        if (root.isConnected) {
            connectionObserver?.disconnect();
            connectionObserver = null;
            if (!dialog.open)
                dialog.showModal();
        }
        else if (!connectionObserver) {
            connectionObserver = new MutationObserver(showModal);
            connectionObserver.observe(root.ownerDocument, { childList: true, subtree: true });
        }
    };
    const synchronize = (): void => {
        root.classList.toggle(cls('--expanded'), expanded);
        toggle?.setAttribute('aria-expanded', String(expanded));
        toggle?.setAttribute('aria-label', (expanded ? options.collapseLabel : options.expandLabel)!);
        if (toggle)
            toggle.innerHTML = (expanded ? options.collapseIcon : options.expandIcon)!;
        if (dialog) {
            if (expanded)
                showModal();
            else {
                connectionObserver?.disconnect();
                connectionObserver = null;
                if (dialog.open)
                    dialog.close();
            }
        }
        else if (options.hideWhenCollapsed) {
            root.toggleAttribute('inert', !expanded);
            root.setAttribute('aria-hidden', String(!expanded));
        }
    };
    const setExpanded = (value: boolean): NavigationRailComponent => {
        if (destroyed || expanded === value)
            return api;
        expanded = value;
        startSwitch();
        synchronize();
        emitter.emit(value ? 'expand' : 'collapse', { expanded: value });
        if (!destroyed) {
            if (value)
                options.onExpand?.();
            else
                options.onCollapse?.();
        }
        return api;
    };
    const handleClick = (event: MouseEvent): void => {
        if (destroyed || event.defaultPrevented)
            return;
        const target = event.target as Element;
        if (dialog && target === root) {
            const rect = root.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
                api.collapse();
            return;
        }
        if (toggle?.contains(target)) {
            api.toggle();
            return;
        }
        const element = target.closest<HTMLElement>(`.${cls('__item')}`);
        if (!element || !destinations.contains(element))
            return;
        const index = items.findIndex(item => nodes.get(item.id) === element), item = items[index];
        if (!item || item.disabled) {
            event.preventDefault();
            return;
        }
        if (item.href && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0))
            return;
        api.setActive(item.id);
        const detail = { id: item.id, index, originalEvent: event };
        emitter.emit('select', detail);
        if (!destroyed)
            options.onSelect?.(detail);
    };
    const handleKeydown = (event: KeyboardEvent): void => {
        const enabled = [...nodes.values()].filter(element => !element.hasAttribute('aria-disabled'));
        const index = enabled.indexOf(document.activeElement as HTMLElement);
        if (index < 0 || event.altKey || event.ctrlKey || event.metaKey)
            return;
        let next: number;
        switch (event.key) {
            case 'ArrowDown':
                next = (index + 1) % enabled.length;
                break;
            case 'ArrowUp':
                next = (index + enabled.length - 1) % enabled.length;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = enabled.length - 1;
                break;
            default: return;
        }
        event.preventDefault();
        enabled[next].focus();
    };
    const modalTab = (event: KeyboardEvent): void => {
        if (event.key !== 'Tab' || event.defaultPrevented)
            return;
        const focusable = [...root.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')].filter(element => element.tabIndex >= 0 && !element.matches(':disabled, [aria-disabled="true"]') && element.getClientRects().length > 0);
        const first = focusable[0], last = focusable.at(-1), focused = root.ownerDocument.activeElement;
        if (!first) {
            event.preventDefault();
            root.focus();
        }
        else if (event.shiftKey && (focused === first || focused === root)) {
            event.preventDefault();
            last!.focus();
        }
        else if (!event.shiftKey && (focused === last || focused === root)) {
            event.preventDefault();
            first.focus();
        }
    };
    dialog?.addEventListener('keydown', modalTab);
    const dismiss = (event: Event): void => { event.preventDefault(); api.collapse(); };
    dialog?.addEventListener('cancel', dismiss);
    const closed = (): void => { if (!dialog?.open)
        api.collapse(); };
    dialog?.addEventListener('close', closed);
    root.addEventListener('click', handleClick);
    destinations.addEventListener('keydown', handleKeydown);
    const removeRipple = options.ripple ? mountRailRipple(root, cls) : undefined;
    const originalDestroy = component.lifecycle.destroy.bind(component.lifecycle);
    const destroy = (): void => {
        if (destroyed)
            return;
        destroyed = true;
        endSwitch();
        connectionObserver?.disconnect();
        connectionObserver = null;
        dialog?.removeEventListener('keydown', modalTab);
        dialog?.removeEventListener('cancel', dismiss);
        dialog?.removeEventListener('close', closed);
        if (dialog?.open)
            dialog.close();
        root.removeEventListener('click', handleClick);
        destinations.removeEventListener('keydown', handleKeydown);
        removeRipple?.();
        nodes.clear();
        emitter.clear();
        originalDestroy();
    };
    component.lifecycle.destroy = destroy;
    const api: NavigationRailComponent = {
        element: root, getClass, lifecycle: component.lifecycle, destroy,
        expand: () => setExpanded(true), collapse: () => setExpanded(false), toggle: () => setExpanded(!expanded), isExpanded: () => expanded,
        getActive: () => items.find(item => item.active)?.id || null,
        setActive(id) {
            if (destroyed || (id !== null && !items.some(item => item.id === id && !item.disabled)))
                return api;
            items = items.map(item => ({ ...item, active: item.id === id }));
            updateSelection();
            return api;
        },
        getItems: () => items.map(item => ({ ...item })),
        setItems(value) { if (!destroyed) {
            const next = copyItems(value);
            items = next;
            render();
        } return api; },
        setBadge(id, badge, label) {
            if (destroyed)
                return api;
            const item = items.find(item => item.id === id);
            if (item) {
                item.badge = badge;
                item.badgeLabel = label;
                updateBadge(item, nodes.get(id)!);
            }
            return api;
        },
        on(event, handler) { if (!destroyed)
            emitter.on(event, handler); return api; },
        off(event, handler) { emitter.off(event, handler); return api; },
    };
    render();
    synchronize();
    return api;
}
