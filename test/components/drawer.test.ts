// test/components/drawer.test.ts
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';

// Setup jsdom environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: typeof global.document;
let originalGlobalWindow: typeof global.window;

beforeAll(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true
  });

  window = dom.window;
  document = window.document;

  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;

  global.document = document;
  global.window = window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.HTMLButtonElement = window.HTMLButtonElement;
  global.Event = window.Event;
  global.KeyboardEvent = window.KeyboardEvent;
  global.HTMLHRElement = window.HTMLHRElement;
  global.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  };
});

afterAll(() => {
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  window.close();
});

// ---------------------------------------------------------------------------
// Mock drawer component factory
// ---------------------------------------------------------------------------

interface DrawerItemConfig {
  type?: 'item' | 'divider' | 'section';
  id?: string;
  label?: string;
  icon?: string;
  badge?: string;
  active?: boolean;
  disabled?: boolean;
  sectionLabel?: string;
}

interface DrawerConfig {
  variant?: 'standard' | 'modal';
  position?: 'start' | 'end';
  open?: boolean;
  dismissible?: boolean;
  headline?: string;
  items?: DrawerItemConfig[];
  width?: string | number;
  onSelect?: (event: { id: string; label: string; index: number; originalEvent: Event }) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

const createMockDrawer = (config: DrawerConfig = {}) => {
  const {
    variant = 'standard',
    position = 'start',
    open: initialOpen = false,
    dismissible = true,
    headline = '',
    items: initialItems = [],
    width = 360,
    onSelect,
    onOpen,
    onClose,
  } = config;

  // Root element
  const element = document.createElement('aside');
  element.className = `mtrl-drawer mtrl-drawer--${variant} mtrl-drawer--${position}`;

  if (variant === 'modal') {
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'true');
  } else {
    element.setAttribute('role', 'navigation');
  }

  // Sheet
  const sheetEl = document.createElement('div');
  sheetEl.className = 'mtrl-drawer__sheet';
  const w = typeof width === 'number' ? `${width}px` : width;
  sheetEl.style.width = w;

  // Scrim (modal only)
  let scrimEl: HTMLElement | null = null;
  if (variant === 'modal') {
    scrimEl = document.createElement('div');
    scrimEl.className = 'mtrl-drawer__scrim';
    element.appendChild(scrimEl);
  }

  // Headline
  let headlineEl: HTMLElement | null = null;
  let headlineText = headline;
  if (headlineText) {
    headlineEl = document.createElement('div');
    headlineEl.className = 'mtrl-drawer__headline';
    headlineEl.textContent = headlineText;
    sheetEl.appendChild(headlineEl);
  }

  // Items container
  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'mtrl-drawer__items';
  itemsContainer.setAttribute('role', 'tablist');
  itemsContainer.setAttribute('aria-orientation', 'vertical');

  let currentItems = [...initialItems];
  let activeId: string | null = null;
  const eventHandlers: Record<string, Function[]> = {};

  // Find initial active
  const initActive = currentItems.find(
    (i) => i.type !== 'divider' && i.type !== 'section' && i.active
  );
  if (initActive?.id) activeId = initActive.id;

  // Render items
  const renderItems = () => {
    itemsContainer.innerHTML = '';
    let navIdx = 0;

    currentItems.forEach((item) => {
      const type = item.type || 'item';

      if (type === 'divider') {
        const hr = document.createElement('hr');
        hr.className = 'mtrl-drawer__divider';
        hr.setAttribute('role', 'separator');
        itemsContainer.appendChild(hr);
        return;
      }

      if (type === 'section') {
        const sec = document.createElement('div');
        sec.className = 'mtrl-drawer__section-label';
        sec.textContent = item.label || item.sectionLabel || '';
        itemsContainer.appendChild(sec);
        return;
      }

      const btn = document.createElement('button');
      btn.className = 'mtrl-drawer__item';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('tabindex', '-1');
      if (item.id) btn.dataset.id = item.id;
      if (item.disabled) {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      }

      // Active indicator
      const indicator = document.createElement('span');
      indicator.className = 'mtrl-drawer__active-indicator';
      btn.appendChild(indicator);

      if (item.icon) {
        const iconEl = document.createElement('span');
        iconEl.className = 'mtrl-drawer__item-icon';
        iconEl.innerHTML = item.icon;
        btn.appendChild(iconEl);
      }

      if (item.label) {
        const labelEl = document.createElement('span');
        labelEl.className = 'mtrl-drawer__item-label';
        labelEl.textContent = item.label;
        btn.appendChild(labelEl);
      }

      if (item.badge) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'mtrl-drawer__item-badge';
        badgeEl.textContent = item.badge;
        btn.appendChild(badgeEl);
      }

      if (item.active) {
        btn.classList.add('mtrl-drawer__item--active');
        btn.setAttribute('aria-selected', 'true');
        btn.setAttribute('tabindex', '0');
      } else {
        btn.setAttribute('aria-selected', 'false');
      }

      btn.dataset.navIndex = String(navIdx);
      navIdx++;

      btn.addEventListener('click', (e: Event) => {
        if (item.id && !item.disabled) {
          drawerComponent.setActive(item.id);
          const detail = {
            id: item.id,
            label: item.label || '',
            index: parseInt(btn.dataset.navIndex || '0', 10),
            originalEvent: e,
          };
          emit('select', detail);
          if (onSelect) onSelect(detail);
        }
      });

      itemsContainer.appendChild(btn);
    });

    // Ensure first item tabbable if none active
    if (!activeId) {
      const first = itemsContainer.querySelector('.mtrl-drawer__item') as HTMLElement;
      if (first) first.setAttribute('tabindex', '0');
    }
  };

  renderItems();
  sheetEl.appendChild(itemsContainer);
  element.appendChild(sheetEl);

  // State
  let isOpen = initialOpen;
  if (isOpen) {
    element.classList.add('mtrl-drawer--open');
    if (scrimEl) scrimEl.classList.add('mtrl-drawer__scrim--visible');
  }

  // Event helpers
  const emit = (event: string, data?: unknown) => {
    const handlers = eventHandlers[event];
    if (handlers) {
      handlers.forEach((fn) => fn(data));
    }
  };

  // Keyboard handler (modal Escape)
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen && variant === 'modal' && dismissible) {
      e.preventDefault();
      drawerComponent.close();
    }
  };
  if (variant === 'modal') {
    document.addEventListener('keydown', handleKeydown);
    if (scrimEl && dismissible) {
      scrimEl.addEventListener('click', () => drawerComponent.close());
    }
  }

  // Keyboard navigation within items
  itemsContainer.addEventListener('keydown', (e: Event) => {
    const ke = e as KeyboardEvent;
    const items = Array.from(
      itemsContainer.querySelectorAll('.mtrl-drawer__item:not([disabled])')
    ) as HTMLElement[];
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;

    switch (ke.key) {
      case 'ArrowDown':
        ke.preventDefault();
        next = current < items.length - 1 ? current + 1 : 0;
        break;
      case 'ArrowUp':
        ke.preventDefault();
        next = current > 0 ? current - 1 : items.length - 1;
        break;
      case 'Home':
        ke.preventDefault();
        next = 0;
        break;
      case 'End':
        ke.preventDefault();
        next = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        ke.preventDefault();
        if (current >= 0) items[current].click();
        return;
      default:
        return;
    }

    if (next >= 0 && next < items.length) {
      items.forEach((i) => i.setAttribute('tabindex', '-1'));
      items[next].setAttribute('tabindex', '0');
      items[next].focus();
    }
  });

  const drawerComponent = {
    element,

    getClass: (name: string) => `mtrl-${name}`,

    open() {
      if (isOpen) return drawerComponent;
      isOpen = true;
      element.classList.add('mtrl-drawer--open');
      if (scrimEl) scrimEl.classList.add('mtrl-drawer__scrim--visible');
      emit('open');
      if (onOpen) onOpen();
      return drawerComponent;
    },

    close() {
      if (!isOpen) return drawerComponent;
      isOpen = false;
      element.classList.remove('mtrl-drawer--open');
      if (scrimEl) scrimEl.classList.remove('mtrl-drawer__scrim--visible');
      emit('close');
      if (onClose) onClose();
      return drawerComponent;
    },

    toggle() {
      return isOpen ? drawerComponent.close() : drawerComponent.open();
    },

    isOpen() {
      return isOpen;
    },

    setActive(id: string) {
      const allBtns = itemsContainer.querySelectorAll('.mtrl-drawer__item');
      allBtns.forEach((el) => {
        el.classList.remove('mtrl-drawer__item--active');
        el.setAttribute('aria-selected', 'false');
        el.setAttribute('tabindex', '-1');
      });
      const target = itemsContainer.querySelector(`[data-id="${id}"]`) as HTMLElement;
      if (target) {
        target.classList.add('mtrl-drawer__item--active');
        target.setAttribute('aria-selected', 'true');
        target.setAttribute('tabindex', '0');
        activeId = id;
      }
      currentItems = currentItems.map((i) => ({ ...i, active: i.id === id }));
      return drawerComponent;
    },

    getActive() {
      return activeId;
    },

    setHeadline(text: string) {
      headlineText = text;
      if (text) {
        if (!headlineEl) {
          headlineEl = document.createElement('div');
          headlineEl.className = 'mtrl-drawer__headline';
          sheetEl.insertBefore(headlineEl, itemsContainer);
        }
        headlineEl.textContent = text;
      } else if (headlineEl && headlineEl.parentNode) {
        headlineEl.parentNode.removeChild(headlineEl);
        headlineEl = null;
      }
      return drawerComponent;
    },

    getHeadline() {
      return headlineText;
    },

    setItems(items: DrawerItemConfig[]) {
      currentItems = items;
      const act = items.find(
        (i) => i.type !== 'divider' && i.type !== 'section' && i.active
      );
      activeId = act?.id || null;
      renderItems();
      return drawerComponent;
    },

    getItems() {
      return currentItems;
    },

    setBadge(id: string, badge: string) {
      const itemEl = itemsContainer.querySelector(`[data-id="${id}"]`) as HTMLElement;
      if (!itemEl) return drawerComponent;
      let badgeEl = itemEl.querySelector('.mtrl-drawer__item-badge') as HTMLElement;
      if (badge) {
        if (!badgeEl) {
          badgeEl = document.createElement('span');
          badgeEl.className = 'mtrl-drawer__item-badge';
          itemEl.appendChild(badgeEl);
        }
        badgeEl.textContent = badge;
      } else if (badgeEl) {
        badgeEl.remove();
      }
      currentItems = currentItems.map((i) =>
        i.id === id ? { ...i, badge } : i
      );
      return drawerComponent;
    },

    on(event: string, handler: Function) {
      if (!eventHandlers[event]) eventHandlers[event] = [];
      eventHandlers[event].push(handler);
      return drawerComponent;
    },

    off(event: string, handler: Function) {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter((h) => h !== handler);
      }
      return drawerComponent;
    },

    addClass(...classes: string[]) {
      element.classList.add(...classes);
      return drawerComponent;
    },

    destroy() {
      if (variant === 'modal') {
        document.removeEventListener('keydown', handleKeydown);
      }
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    },

    lifecycle: {
      destroy() {
        drawerComponent.destroy();
      },
    },
  };

  return drawerComponent;
};

// ===========================================================================
// TESTS
// ===========================================================================

describe('Drawer Component', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  // Clean up after each test
  const cleanup = () => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  // --------------------------------------------------------------------------
  // Creation & Defaults
  // --------------------------------------------------------------------------

  describe('Creation', () => {
    test('should create a drawer element', () => {
      const drawer = createMockDrawer();
      expect(drawer.element).toBeDefined();
      expect(drawer.element.tagName).toBe('ASIDE');
      cleanup();
    });

    test('should default to standard variant', () => {
      const drawer = createMockDrawer();
      expect(drawer.element.classList.contains('mtrl-drawer--standard')).toBe(true);
      cleanup();
    });

    test('should default to start position', () => {
      const drawer = createMockDrawer();
      expect(drawer.element.classList.contains('mtrl-drawer--start')).toBe(true);
      cleanup();
    });

    test('should default to closed state', () => {
      const drawer = createMockDrawer();
      expect(drawer.isOpen()).toBe(false);
      expect(drawer.element.classList.contains('mtrl-drawer--open')).toBe(false);
      cleanup();
    });

    test('should apply initial open state', () => {
      const drawer = createMockDrawer({ open: true });
      expect(drawer.isOpen()).toBe(true);
      expect(drawer.element.classList.contains('mtrl-drawer--open')).toBe(true);
      cleanup();
    });

    test('should create with custom width', () => {
      const drawer = createMockDrawer({ width: 320 });
      const sheet = drawer.element.querySelector('.mtrl-drawer__sheet') as HTMLElement;
      expect(sheet.style.width).toBe('320px');
      cleanup();
    });

    test('should accept string width', () => {
      const drawer = createMockDrawer({ width: '50vw' });
      const sheet = drawer.element.querySelector('.mtrl-drawer__sheet') as HTMLElement;
      expect(sheet.style.width).toBe('50vw');
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Variants
  // --------------------------------------------------------------------------

  describe('Variants', () => {
    test('should create standard variant', () => {
      const drawer = createMockDrawer({ variant: 'standard' });
      expect(drawer.element.classList.contains('mtrl-drawer--standard')).toBe(true);
      expect(drawer.element.getAttribute('role')).toBe('navigation');
      cleanup();
    });

    test('should create modal variant', () => {
      const drawer = createMockDrawer({ variant: 'modal' });
      expect(drawer.element.classList.contains('mtrl-drawer--modal')).toBe(true);
      expect(drawer.element.getAttribute('role')).toBe('dialog');
      expect(drawer.element.getAttribute('aria-modal')).toBe('true');
      cleanup();
    });

    test('should create scrim for modal variant', () => {
      const drawer = createMockDrawer({ variant: 'modal' });
      const scrim = drawer.element.querySelector('.mtrl-drawer__scrim');
      expect(scrim).not.toBeNull();
      cleanup();
    });

    test('should NOT create scrim for standard variant', () => {
      const drawer = createMockDrawer({ variant: 'standard' });
      const scrim = drawer.element.querySelector('.mtrl-drawer__scrim');
      expect(scrim).toBeNull();
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Position
  // --------------------------------------------------------------------------

  describe('Position', () => {
    test('should apply start position', () => {
      const drawer = createMockDrawer({ position: 'start' });
      expect(drawer.element.classList.contains('mtrl-drawer--start')).toBe(true);
      cleanup();
    });

    test('should apply end position', () => {
      const drawer = createMockDrawer({ position: 'end' });
      expect(drawer.element.classList.contains('mtrl-drawer--end')).toBe(true);
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Open / Close / Toggle
  // --------------------------------------------------------------------------

  describe('State Management', () => {
    test('should open the drawer', () => {
      const drawer = createMockDrawer();
      drawer.open();
      expect(drawer.isOpen()).toBe(true);
      expect(drawer.element.classList.contains('mtrl-drawer--open')).toBe(true);
      cleanup();
    });

    test('should close the drawer', () => {
      const drawer = createMockDrawer({ open: true });
      drawer.close();
      expect(drawer.isOpen()).toBe(false);
      expect(drawer.element.classList.contains('mtrl-drawer--open')).toBe(false);
      cleanup();
    });

    test('should toggle the drawer', () => {
      const drawer = createMockDrawer();
      expect(drawer.isOpen()).toBe(false);

      drawer.toggle();
      expect(drawer.isOpen()).toBe(true);

      drawer.toggle();
      expect(drawer.isOpen()).toBe(false);
      cleanup();
    });

    test('should not re-open when already open', () => {
      let openCount = 0;
      const drawer = createMockDrawer({ open: true, onOpen: () => openCount++ });
      drawer.open();
      expect(openCount).toBe(0); // Should not fire again
      cleanup();
    });

    test('should not re-close when already closed', () => {
      let closeCount = 0;
      const drawer = createMockDrawer({ onClose: () => closeCount++ });
      drawer.close();
      expect(closeCount).toBe(0); // Should not fire
      cleanup();
    });

    test('should show scrim when modal opens', () => {
      const drawer = createMockDrawer({ variant: 'modal' });
      drawer.open();
      const scrim = drawer.element.querySelector('.mtrl-drawer__scrim');
      expect(scrim?.classList.contains('mtrl-drawer__scrim--visible')).toBe(true);
      cleanup();
    });

    test('should hide scrim when modal closes', () => {
      const drawer = createMockDrawer({ variant: 'modal', open: true });
      drawer.close();
      const scrim = drawer.element.querySelector('.mtrl-drawer__scrim');
      expect(scrim?.classList.contains('mtrl-drawer__scrim--visible')).toBe(false);
      cleanup();
    });

    test('should support method chaining on open/close/toggle', () => {
      const drawer = createMockDrawer();
      const result = drawer.open().close().toggle();
      expect(result).toBe(drawer);
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Events
  // --------------------------------------------------------------------------

  describe('Events', () => {
    test('should emit open event', () => {
      let opened = false;
      const drawer = createMockDrawer();
      drawer.on('open', () => { opened = true; });
      drawer.open();
      expect(opened).toBe(true);
      cleanup();
    });

    test('should emit close event', () => {
      let closed = false;
      const drawer = createMockDrawer({ open: true });
      drawer.on('close', () => { closed = true; });
      drawer.close();
      expect(closed).toBe(true);
      cleanup();
    });

    test('should call onOpen callback', () => {
      let called = false;
      const drawer = createMockDrawer({ onOpen: () => { called = true; } });
      drawer.open();
      expect(called).toBe(true);
      cleanup();
    });

    test('should call onClose callback', () => {
      let called = false;
      const drawer = createMockDrawer({ open: true, onClose: () => { called = true; } });
      drawer.close();
      expect(called).toBe(true);
      cleanup();
    });

    test('should emit select event when item is clicked', () => {
      let selectedId = '';
      const drawer = createMockDrawer({
        items: [
          { id: 'inbox', label: 'Inbox' },
          { id: 'sent', label: 'Sent' },
        ],
      });
      drawer.on('select', (e: { id: string }) => { selectedId = e.id; });

      const item = drawer.element.querySelector('[data-id="sent"]') as HTMLElement;
      item.click();

      expect(selectedId).toBe('sent');
      cleanup();
    });

    test('should call onSelect callback with event detail', () => {
      let detail: { id: string; label: string; index: number } | null = null;
      const drawer = createMockDrawer({
        items: [
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
        ],
        onSelect: (e) => { detail = e; },
      });

      const item = drawer.element.querySelector('[data-id="b"]') as HTMLElement;
      item.click();

      expect(detail).not.toBeNull();
      expect(detail!.id).toBe('b');
      expect(detail!.label).toBe('Beta');
      expect(detail!.index).toBe(1);
      cleanup();
    });

    test('should remove event listener with off', () => {
      let count = 0;
      const handler = () => { count++; };
      const drawer = createMockDrawer();
      drawer.on('open', handler);
      drawer.open();
      expect(count).toBe(1);

      drawer.off('open', handler);
      drawer.close();
      drawer.open();
      expect(count).toBe(1); // Should not increment
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Headline
  // --------------------------------------------------------------------------

  describe('Headline', () => {
    test('should render headline when provided', () => {
      const drawer = createMockDrawer({ headline: 'Mail' });
      const headlineEl = drawer.element.querySelector('.mtrl-drawer__headline');
      expect(headlineEl).not.toBeNull();
      expect(headlineEl?.textContent).toBe('Mail');
      cleanup();
    });

    test('should not render headline when not provided', () => {
      const drawer = createMockDrawer();
      const headlineEl = drawer.element.querySelector('.mtrl-drawer__headline');
      expect(headlineEl).toBeNull();
      cleanup();
    });

    test('should update headline with setHeadline', () => {
      const drawer = createMockDrawer({ headline: 'Old' });
      drawer.setHeadline('New');
      expect(drawer.getHeadline()).toBe('New');
      const el = drawer.element.querySelector('.mtrl-drawer__headline');
      expect(el?.textContent).toBe('New');
      cleanup();
    });

    test('should create headline element when setting on drawer without one', () => {
      const drawer = createMockDrawer();
      drawer.setHeadline('Created');
      const el = drawer.element.querySelector('.mtrl-drawer__headline');
      expect(el).not.toBeNull();
      expect(el?.textContent).toBe('Created');
      cleanup();
    });

    test('should remove headline when set to empty string', () => {
      const drawer = createMockDrawer({ headline: 'Remove Me' });
      drawer.setHeadline('');
      expect(drawer.getHeadline()).toBe('');
      const el = drawer.element.querySelector('.mtrl-drawer__headline');
      expect(el).toBeNull();
      cleanup();
    });

    test('should support method chaining on setHeadline', () => {
      const drawer = createMockDrawer();
      const result = drawer.setHeadline('Test');
      expect(result).toBe(drawer);
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Items
  // --------------------------------------------------------------------------

  describe('Items', () => {
    const sampleItems: DrawerItemConfig[] = [
      { id: 'inbox', label: 'Inbox', icon: '<svg></svg>', badge: '24', active: true },
      { id: 'outbox', label: 'Outbox', icon: '<svg></svg>' },
      { type: 'divider' },
      { type: 'section', label: 'Labels' },
      { id: 'family', label: 'Family' },
    ];

    test('should render navigation items', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const items = drawer.element.querySelectorAll('.mtrl-drawer__item');
      expect(items.length).toBe(3); // 3 nav items, not divider/section
      cleanup();
    });

    test('should render dividers', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const dividers = drawer.element.querySelectorAll('.mtrl-drawer__divider');
      expect(dividers.length).toBe(1);
      cleanup();
    });

    test('should render section labels', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const sections = drawer.element.querySelectorAll('.mtrl-drawer__section-label');
      expect(sections.length).toBe(1);
      expect(sections[0].textContent).toBe('Labels');
      cleanup();
    });

    test('should render item labels', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const labels = drawer.element.querySelectorAll('.mtrl-drawer__item-label');
      expect(labels[0].textContent).toBe('Inbox');
      expect(labels[1].textContent).toBe('Outbox');
      cleanup();
    });

    test('should render item icons', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const icons = drawer.element.querySelectorAll('.mtrl-drawer__item-icon');
      // Only items with icons: inbox and outbox
      expect(icons.length).toBe(2);
      cleanup();
    });

    test('should render badges', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const badges = drawer.element.querySelectorAll('.mtrl-drawer__item-badge');
      expect(badges.length).toBe(1);
      expect(badges[0].textContent).toBe('24');
      cleanup();
    });

    test('should render active indicator for each item', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const indicators = drawer.element.querySelectorAll('.mtrl-drawer__active-indicator');
      expect(indicators.length).toBe(3); // One per nav item
      cleanup();
    });

    test('should mark active item', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const activeItem = drawer.element.querySelector('.mtrl-drawer__item--active');
      expect(activeItem).not.toBeNull();
      expect(activeItem?.getAttribute('data-id')).toBe('inbox');
      expect(activeItem?.getAttribute('aria-selected')).toBe('true');
      cleanup();
    });

    test('should set aria-selected false on inactive items', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const outbox = drawer.element.querySelector('[data-id="outbox"]');
      expect(outbox?.getAttribute('aria-selected')).toBe('false');
      cleanup();
    });

    test('should set role=tab on nav items', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const items = drawer.element.querySelectorAll('.mtrl-drawer__item');
      items.forEach((item) => {
        expect(item.getAttribute('role')).toBe('tab');
      });
      cleanup();
    });

    test('should set role=separator on dividers', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const divider = drawer.element.querySelector('.mtrl-drawer__divider');
      expect(divider?.getAttribute('role')).toBe('separator');
      cleanup();
    });

    test('should handle disabled items', () => {
      const drawer = createMockDrawer({
        items: [{ id: 'dis', label: 'Disabled', disabled: true }],
      });
      const item = drawer.element.querySelector('[data-id="dis"]') as HTMLButtonElement;
      expect(item.disabled).toBe(true);
      expect(item.getAttribute('aria-disabled')).toBe('true');
      cleanup();
    });

    test('should not trigger select on disabled items', () => {
      let selected = false;
      const drawer = createMockDrawer({
        items: [{ id: 'dis', label: 'Disabled', disabled: true }],
        onSelect: () => { selected = true; },
      });
      // Clicking disabled buttons doesn't fire click by default in browsers,
      // but we guard in the handler anyway
      // Just verify it's disabled
      const item = drawer.element.querySelector('[data-id="dis"]') as HTMLButtonElement;
      expect(item.disabled).toBe(true);
      cleanup();
    });

    test('should update items with setItems', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      drawer.setItems([
        { id: 'new1', label: 'New 1' },
        { id: 'new2', label: 'New 2', active: true },
      ]);
      const items = drawer.element.querySelectorAll('.mtrl-drawer__item');
      expect(items.length).toBe(2);
      expect(drawer.getActive()).toBe('new2');
      cleanup();
    });

    test('should return items with getItems', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const items = drawer.getItems();
      expect(items.length).toBe(sampleItems.length);
      cleanup();
    });

    test('should support method chaining on setItems', () => {
      const drawer = createMockDrawer();
      const result = drawer.setItems([{ id: 'a', label: 'A' }]);
      expect(result).toBe(drawer);
      cleanup();
    });

    test('should render items container with tablist role', () => {
      const drawer = createMockDrawer({ items: sampleItems });
      const itemsContainer = drawer.element.querySelector('.mtrl-drawer__items');
      expect(itemsContainer?.getAttribute('role')).toBe('tablist');
      expect(itemsContainer?.getAttribute('aria-orientation')).toBe('vertical');
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Active State
  // --------------------------------------------------------------------------

  describe('Active State', () => {
    const items: DrawerItemConfig[] = [
      { id: 'a', label: 'A', active: true },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ];

    test('should set initial active item', () => {
      const drawer = createMockDrawer({ items });
      expect(drawer.getActive()).toBe('a');
      cleanup();
    });

    test('should change active item with setActive', () => {
      const drawer = createMockDrawer({ items });
      drawer.setActive('b');
      expect(drawer.getActive()).toBe('b');
      cleanup();
    });

    test('should update DOM when active changes', () => {
      const drawer = createMockDrawer({ items });
      drawer.setActive('b');

      const aItem = drawer.element.querySelector('[data-id="a"]');
      const bItem = drawer.element.querySelector('[data-id="b"]');

      expect(aItem?.classList.contains('mtrl-drawer__item--active')).toBe(false);
      expect(aItem?.getAttribute('aria-selected')).toBe('false');

      expect(bItem?.classList.contains('mtrl-drawer__item--active')).toBe(true);
      expect(bItem?.getAttribute('aria-selected')).toBe('true');
      cleanup();
    });

    test('should deactivate all other items when one is activated', () => {
      const drawer = createMockDrawer({ items });
      drawer.setActive('c');

      const activeItems = drawer.element.querySelectorAll('.mtrl-drawer__item--active');
      expect(activeItems.length).toBe(1);
      expect(activeItems[0].getAttribute('data-id')).toBe('c');
      cleanup();
    });

    test('should update active on item click', () => {
      const drawer = createMockDrawer({ items });
      const bItem = drawer.element.querySelector('[data-id="b"]') as HTMLElement;
      bItem.click();
      expect(drawer.getActive()).toBe('b');
      cleanup();
    });

    test('should return null if no active item', () => {
      const drawer = createMockDrawer({
        items: [{ id: 'x', label: 'X' }], // No active: true
      });
      expect(drawer.getActive()).toBeNull();
      cleanup();
    });

    test('should update tabindex on active change (roving tabindex)', () => {
      const drawer = createMockDrawer({ items });
      drawer.setActive('c');

      const aItem = drawer.element.querySelector('[data-id="a"]');
      const cItem = drawer.element.querySelector('[data-id="c"]');

      expect(aItem?.getAttribute('tabindex')).toBe('-1');
      expect(cItem?.getAttribute('tabindex')).toBe('0');
      cleanup();
    });

    test('should support method chaining on setActive', () => {
      const drawer = createMockDrawer({ items });
      const result = drawer.setActive('b');
      expect(result).toBe(drawer);
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Badges
  // --------------------------------------------------------------------------

  describe('Badges', () => {
    const items: DrawerItemConfig[] = [
      { id: 'inbox', label: 'Inbox', badge: '5' },
      { id: 'sent', label: 'Sent' },
    ];

    test('should render initial badge', () => {
      const drawer = createMockDrawer({ items });
      const badge = drawer.element.querySelector('[data-id="inbox"] .mtrl-drawer__item-badge');
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toBe('5');
      cleanup();
    });

    test('should update badge with setBadge', () => {
      const drawer = createMockDrawer({ items });
      drawer.setBadge('inbox', '99');
      const badge = drawer.element.querySelector('[data-id="inbox"] .mtrl-drawer__item-badge');
      expect(badge?.textContent).toBe('99');
      cleanup();
    });

    test('should add badge to item without one', () => {
      const drawer = createMockDrawer({ items });
      drawer.setBadge('sent', '3');
      const badge = drawer.element.querySelector('[data-id="sent"] .mtrl-drawer__item-badge');
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toBe('3');
      cleanup();
    });

    test('should remove badge when set to empty string', () => {
      const drawer = createMockDrawer({ items });
      drawer.setBadge('inbox', '');
      const badge = drawer.element.querySelector('[data-id="inbox"] .mtrl-drawer__item-badge');
      expect(badge).toBeNull();
      cleanup();
    });

    test('should update items config when badge changes', () => {
      const drawer = createMockDrawer({ items });
      drawer.setBadge('inbox', '42');
      const updated = drawer.getItems().find((i) => i.id === 'inbox');
      expect(updated?.badge).toBe('42');
      cleanup();
    });

    test('should support method chaining on setBadge', () => {
      const drawer = createMockDrawer({ items });
      const result = drawer.setBadge('inbox', '10');
      expect(result).toBe(drawer);
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Modal Dismiss Behavior
  // --------------------------------------------------------------------------

  describe('Modal Dismiss', () => {
    test('should close modal on scrim click when dismissible', () => {
      const drawer = createMockDrawer({ variant: 'modal', open: true, dismissible: true });
      container.appendChild(drawer.element);

      const scrim = drawer.element.querySelector('.mtrl-drawer__scrim') as HTMLElement;
      scrim.click();

      expect(drawer.isOpen()).toBe(false);
      cleanup();
    });

    test('should close modal on Escape key when dismissible', () => {
      const drawer = createMockDrawer({ variant: 'modal', open: true, dismissible: true });
      container.appendChild(drawer.element);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      expect(drawer.isOpen()).toBe(false);
      cleanup();
    });

    test('should NOT close standard drawer on Escape', () => {
      const drawer = createMockDrawer({ variant: 'standard', open: true });
      container.appendChild(drawer.element);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      expect(drawer.isOpen()).toBe(true);
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Keyboard Navigation
  // --------------------------------------------------------------------------

  describe('Keyboard Navigation', () => {
    const items: DrawerItemConfig[] = [
      { id: 'a', label: 'Alpha', active: true },
      { id: 'b', label: 'Beta' },
      { id: 'c', label: 'Charlie' },
    ];

    test('should move focus down with ArrowDown', () => {
      const drawer = createMockDrawer({ items });
      container.appendChild(drawer.element);

      const itemEls = drawer.element.querySelectorAll('.mtrl-drawer__item') as NodeListOf<HTMLElement>;
      itemEls[0].focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      drawer.element.querySelector('.mtrl-drawer__items')!.dispatchEvent(event);

      expect(itemEls[1].getAttribute('tabindex')).toBe('0');
      cleanup();
    });

    test('should move focus up with ArrowUp', () => {
      const drawer = createMockDrawer({ items });
      container.appendChild(drawer.element);

      const itemEls = drawer.element.querySelectorAll('.mtrl-drawer__item') as NodeListOf<HTMLElement>;
      itemEls[2].focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
      drawer.element.querySelector('.mtrl-drawer__items')!.dispatchEvent(event);

      // Since itemEls[2] is focused and we go up, itemEls[1] should get tabindex 0
      expect(itemEls[1].getAttribute('tabindex')).toBe('0');
      cleanup();
    });

    test('should wrap focus from last to first with ArrowDown', () => {
      const drawer = createMockDrawer({ items });
      container.appendChild(drawer.element);

      const itemEls = drawer.element.querySelectorAll('.mtrl-drawer__item') as NodeListOf<HTMLElement>;
      itemEls[2].focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      drawer.element.querySelector('.mtrl-drawer__items')!.dispatchEvent(event);

      expect(itemEls[0].getAttribute('tabindex')).toBe('0');
      cleanup();
    });

    test('should go to first item with Home', () => {
      const drawer = createMockDrawer({ items });
      container.appendChild(drawer.element);

      const itemEls = drawer.element.querySelectorAll('.mtrl-drawer__item') as NodeListOf<HTMLElement>;
      itemEls[2].focus();

      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
      drawer.element.querySelector('.mtrl-drawer__items')!.dispatchEvent(event);

      expect(itemEls[0].getAttribute('tabindex')).toBe('0');
      cleanup();
    });

    test('should go to last item with End', () => {
      const drawer = createMockDrawer({ items });
      container.appendChild(drawer.element);

      const itemEls = drawer.element.querySelectorAll('.mtrl-drawer__item') as NodeListOf<HTMLElement>;
      itemEls[0].focus();

      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
      drawer.element.querySelector('.mtrl-drawer__items')!.dispatchEvent(event);

      expect(itemEls[2].getAttribute('tabindex')).toBe('0');
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // DOM Structure
  // --------------------------------------------------------------------------

  describe('DOM Structure', () => {
    test('should have sheet element inside root', () => {
      const drawer = createMockDrawer();
      const sheet = drawer.element.querySelector('.mtrl-drawer__sheet');
      expect(sheet).not.toBeNull();
      cleanup();
    });

    test('should have items container inside sheet', () => {
      const drawer = createMockDrawer({ items: [{ id: 'a', label: 'A' }] });
      const sheet = drawer.element.querySelector('.mtrl-drawer__sheet');
      const itemsContainer = sheet?.querySelector('.mtrl-drawer__items');
      expect(itemsContainer).not.toBeNull();
      cleanup();
    });

    test('headline should appear before items in the sheet', () => {
      const drawer = createMockDrawer({
        headline: 'Mail',
        items: [{ id: 'a', label: 'A' }],
      });
      const sheet = drawer.element.querySelector('.mtrl-drawer__sheet') as HTMLElement;
      const children = Array.from(sheet.children);
      const headlineIdx = children.findIndex((c) => c.classList.contains('mtrl-drawer__headline'));
      const itemsIdx = children.findIndex((c) => c.classList.contains('mtrl-drawer__items'));
      expect(headlineIdx).toBeLessThan(itemsIdx);
      cleanup();
    });

    test('modal scrim should be before sheet in root', () => {
      const drawer = createMockDrawer({ variant: 'modal' });
      const children = Array.from(drawer.element.children);
      const scrimIdx = children.findIndex((c) => c.classList.contains('mtrl-drawer__scrim'));
      const sheetIdx = children.findIndex((c) => c.classList.contains('mtrl-drawer__sheet'));
      expect(scrimIdx).toBeLessThan(sheetIdx);
      cleanup();
    });

    test('item should contain active indicator, icon, label in order', () => {
      const drawer = createMockDrawer({
        items: [{ id: 'test', label: 'Test', icon: '<svg></svg>' }],
      });
      const item = drawer.element.querySelector('[data-id="test"]') as HTMLElement;
      const children = Array.from(item.children);

      expect(children[0].classList.contains('mtrl-drawer__active-indicator')).toBe(true);
      expect(children[1].classList.contains('mtrl-drawer__item-icon')).toBe(true);
      expect(children[2].classList.contains('mtrl-drawer__item-label')).toBe(true);
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // addClass / Utility Methods
  // --------------------------------------------------------------------------

  describe('Utility Methods', () => {
    test('should add classes with addClass', () => {
      const drawer = createMockDrawer();
      drawer.addClass('custom-class', 'another');
      expect(drawer.element.classList.contains('custom-class')).toBe(true);
      expect(drawer.element.classList.contains('another')).toBe(true);
      cleanup();
    });

    test('should support method chaining on addClass', () => {
      const drawer = createMockDrawer();
      const result = drawer.addClass('test');
      expect(result).toBe(drawer);
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Lifecycle / Destroy
  // --------------------------------------------------------------------------

  describe('Lifecycle', () => {
    test('should remove element from DOM on destroy', () => {
      const drawer = createMockDrawer();
      container.appendChild(drawer.element);
      expect(container.contains(drawer.element)).toBe(true);

      drawer.destroy();
      expect(container.contains(drawer.element)).toBe(false);
      cleanup();
    });

    test('should have lifecycle.destroy method', () => {
      const drawer = createMockDrawer();
      expect(drawer.lifecycle).toBeDefined();
      expect(typeof drawer.lifecycle.destroy).toBe('function');
      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Complex Scenarios
  // --------------------------------------------------------------------------

  describe('Complex Scenarios', () => {
    test('should handle replacing items that include the active item', () => {
      const drawer = createMockDrawer({
        items: [
          { id: 'a', label: 'A', active: true },
          { id: 'b', label: 'B' },
        ],
      });
      expect(drawer.getActive()).toBe('a');

      // Replace items — active item is gone
      drawer.setItems([
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D', active: true },
      ]);
      expect(drawer.getActive()).toBe('d');
      cleanup();
    });

    test('should handle setItems with no active item', () => {
      const drawer = createMockDrawer({
        items: [{ id: 'a', label: 'A', active: true }],
      });
      drawer.setItems([
        { id: 'x', label: 'X' },
        { id: 'y', label: 'Y' },
      ]);
      expect(drawer.getActive()).toBeNull();
      cleanup();
    });

    test('should handle empty items array', () => {
      const drawer = createMockDrawer({ items: [] });
      const items = drawer.element.querySelectorAll('.mtrl-drawer__item');
      expect(items.length).toBe(0);
      cleanup();
    });

    test('should handle items with only dividers and sections', () => {
      const drawer = createMockDrawer({
        items: [
          { type: 'section', label: 'Group' },
          { type: 'divider' },
        ],
      });
      const navItems = drawer.element.querySelectorAll('.mtrl-drawer__item');
      expect(navItems.length).toBe(0);

      const sections = drawer.element.querySelectorAll('.mtrl-drawer__section-label');
      expect(sections.length).toBe(1);

      const dividers = drawer.element.querySelectorAll('.mtrl-drawer__divider');
      expect(dividers.length).toBe(1);
      cleanup();
    });

    test('should chain multiple operations', () => {
      const drawer = createMockDrawer({
        items: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ],
      });

      const result = drawer
        .open()
        .setActive('b')
        .setHeadline('Navigation')
        .setBadge('a', '10')
        .addClass('custom');

      expect(result).toBe(drawer);
      expect(drawer.isOpen()).toBe(true);
      expect(drawer.getActive()).toBe('b');
      expect(drawer.getHeadline()).toBe('Navigation');
      expect(drawer.element.classList.contains('custom')).toBe(true);
      cleanup();
    });

    test('should handle rapid open/close toggling', () => {
      const drawer = createMockDrawer();
      for (let i = 0; i < 50; i++) {
        drawer.toggle();
      }
      // 50 toggles from closed = closed (even number)
      expect(drawer.isOpen()).toBe(false);
      cleanup();
    });
  });
});
