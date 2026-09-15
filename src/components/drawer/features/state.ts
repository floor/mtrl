import { DrawerConfig } from "../types";
import { DRAWER_EVENTS } from "../constants";

interface StateBaseComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  emit: (event: string, data?: unknown) => void;
}

/**
 * What withState adds
 */
export interface StateFeature {
  scrimElement: HTMLElement | null;
  drawerState: {
    open: () => void;
    close: () => void;
    toggle: () => void;
    isOpen: () => boolean;
  };
  _stateCleanup: () => void;
}

// Drawer modals share ownership so closing one cannot unlock another.
interface ModalState {
  roots: HTMLElement[];
  inerted: Element[];
  overflow: string;
  priority: string;
}
const modals = new WeakMap<Document, ModalState>();
function updateBackground(doc: Document, state: ModalState): void {
  state.inerted.forEach(element => element.removeAttribute("inert"));
  state.inerted = [];
  let branch: Element | undefined = state.roots.at(-1);
  while (branch?.parentElement) {
    for (const sibling of branch.parentElement.children) {
      if (sibling !== branch && !sibling.hasAttribute("inert")) {
        sibling.setAttribute("inert", "");
        state.inerted.push(sibling);
      }
    }
    branch = branch.parentElement;
    if (branch === doc.body) break;
  }
}
function acquireModal(root: HTMLElement): void {
  const doc = root.ownerDocument;
  let state = modals.get(doc);
  if (!state) {
    state = { roots: [], inerted: [], overflow: doc.body.style.overflow, priority: doc.body.style.getPropertyPriority("overflow") };
    modals.set(doc, state);
    doc.body.style.setProperty("overflow", "hidden");
  }
  if (!state.roots.includes(root)) state.roots.push(root);
  updateBackground(doc, state);
}
function releaseModal(root: HTMLElement): void {
  const doc = root.ownerDocument;
  const state = modals.get(doc);
  if (!state || !state.roots.includes(root)) return;
  state.roots = state.roots.filter(element => element !== root);
  updateBackground(doc, state);
  if (!state.roots.length) {
    doc.body.style.setProperty("overflow", state.overflow, state.priority);
    modals.delete(doc);
  }
}

/** Standard drawers remain in the page; modal drawers own focus and background interaction. */
export const withState = (config: DrawerConfig) => <C extends StateBaseComponent>(component: C): C & StateFeature => {
  const root = component.element;
  const doc = root.ownerDocument;
  const isModal = config.variant === "modal";
  const dismissible = config.dismissible !== false;
  let isOpen = config.open === true;
  let destroyed = false;
  let frame: number | null = null;
  let previousFocus: HTMLElement | null = null;
  const scrimElement = isModal ? doc.createElement("div") : null;
  if (scrimElement) {
    scrimElement.className = component.getClass("drawer__scrim");
    scrimElement.setAttribute("aria-hidden", "true");
    if (dismissible) scrimElement.addEventListener("click", close);
  }
  const cancelFocus = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };
  const focusable = () => [...root.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')].filter(element => {
    const style = doc.defaultView!.getComputedStyle(element);
    return element.tabIndex >= 0 && !element.matches(':disabled, [aria-disabled="true"]') && !element.closest('[inert], [hidden]') && style.display !== 'none' && style.visibility !== 'hidden';
  });
  const focusInside = () => {
    const items = focusable();
    (items.find(element => element.getAttribute("aria-current") === "page") || items[0] || root).focus();
  };
  const isTopModal = () => modals.get(doc)?.roots.at(-1) === root;
  function handleKeydown(event: KeyboardEvent): void {
    if (!isOpen || !isTopModal() || event.defaultPrevented) return;
    if (event.key === "Escape" && dismissible) {
      event.preventDefault(); close();
    } else if (event.key === "Tab") {
      const items = focusable();
      const first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); root.focus(); }
      else if (event.shiftKey && (doc.activeElement === first || doc.activeElement === root || !root.contains(doc.activeElement))) {
        event.preventDefault(); last!.focus();
      } else if (!event.shiftKey && (doc.activeElement === last || doc.activeElement === root || !root.contains(doc.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
  }
  function handleFocus(event: FocusEvent): void {
    if (isOpen && isTopModal() && !root.contains(event.target as Node)) focusInside();
  }
  const synchronize = () => {
    root.classList.toggle(`${component.getClass("drawer")}--open`, isOpen);
    root.toggleAttribute("inert", !isOpen);
    root.setAttribute("aria-hidden", String(!isOpen));
    scrimElement?.classList.toggle(`${component.getClass("drawer__scrim")}--visible`, isOpen);
  };
  const activate = () => {
    if (!isModal) return;
    previousFocus = doc.activeElement as HTMLElement | null;
    if (root.isConnected) acquireModal(root);
    doc.addEventListener("keydown", handleKeydown);
    doc.addEventListener("focusin", handleFocus);
    frame = requestAnimationFrame(() => {
      frame = null;
      if (destroyed || !isOpen || !root.isConnected) return;
      acquireModal(root);
      if (isTopModal()) focusInside();
    });
  };
  const deactivate = () => {
    cancelFocus();
    doc.removeEventListener("keydown", handleKeydown);
    doc.removeEventListener("focusin", handleFocus);
    const restore = isTopModal();
    releaseModal(root);
    if (restore && previousFocus?.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus();
    previousFocus = null;
  };
  function open(): void {
    if (destroyed || isOpen) return;
    isOpen = true; synchronize(); activate();
    component.emit(DRAWER_EVENTS.OPEN); config.onOpen?.();
  }
  function close(): void {
    if (destroyed || !isOpen) return;
    isOpen = false; deactivate(); synchronize();
    component.emit(DRAWER_EVENTS.CLOSE); config.onClose?.();
  }
  synchronize();
  if (isOpen) activate();
  return {
    ...component,
    scrimElement,
    drawerState: { open, close, toggle: () => isOpen ? close() : open(), isOpen: () => isOpen },
    _stateCleanup: () => {
      if (destroyed) return;
      destroyed = true; isOpen = false; deactivate(); synchronize();
      scrimElement?.removeEventListener("click", close);
      scrimElement?.remove();
    },
  };
};
