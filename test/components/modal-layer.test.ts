// test/components/modal-layer.test.ts
//
// `layer: "top"` on the modal surfaces: the dialog, the modal bottom and side
// sheets and the modal drawer render a <dialog> in place and open it with
// showModal(); Escape (the dialog's cancel event), the backdrop and a close
// the browser makes on its own each close them once. Without the option, and
// for the standard variants, nothing changes. JSDOM has no showModal(): it is
// stubbed on this window's prototype, the open attribute and a queued close
// event as the browser has them. The browser half (the top layer, inertness,
// styles) is in scripts/check-elements.ts.

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { JSDOM } from "jsdom";
import createDialog from "../../src/components/dialog";
import createBottomSheet from "../../src/components/bottom-sheet";
import createSideSheet from "../../src/components/side-sheet";
import createDrawer from "../../src/components/drawer";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as unknown as Record<string, unknown>;
const globals: Record<string, unknown> = {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLDialogElement: dom.window.HTMLDialogElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Event: dom.window.Event,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  FocusEvent: dom.window.FocusEvent,
  CustomEvent: dom.window.CustomEvent,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
};
const previous: Record<string, unknown> = {};

type Proto = Record<string, unknown>;
const proto = dom.window.HTMLDialogElement.prototype as unknown as Proto;
const calls: string[] = [];

/** showModal() and close() as the browser has them: the open attribute, and a queued close event. */
const installDialog = (): void => {
  proto.showModal = function (this: HTMLDialogElement) {
    if (!this.isConnected) throw new Error("InvalidStateError: not connected");
    calls.push("showModal");
    this.setAttribute("open", "");
  };
  proto.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    calls.push("close");
    this.removeAttribute("open");
    setTimeout(() => this.dispatchEvent(new dom.window.Event("close")), 0);
  };
};
const removeDialog = (): void => {
  delete proto.showModal;
  delete proto.close;
};

const after = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Escape as the browser reports it to the topmost modal: a cancelable cancel event. */
const escape = (dialog: HTMLElement): Event => {
  const event = new dom.window.Event("cancel", { cancelable: true });
  dialog.dispatchEvent(event);
  return event;
};
/** A close the browser makes without asking, as a form's dialog method does. */
const platformClose = (dialog: HTMLElement): void => {
  dialog.removeAttribute("open");
  dialog.dispatchEvent(new dom.window.Event("close"));
};

beforeAll(() => {
  for (const [name, value] of Object.entries(globals)) {
    previous[name] = g[name];
    g[name] = value;
  }
});
afterAll(() => {
  for (const name of Object.keys(globals)) g[name] = previous[name];
});
beforeEach(() => {
  calls.length = 0;
  installDialog();
});
afterEach(() => {
  removeDialog();
  document.body.replaceChildren();
  document.body.style.overflow = "";
});

describe("dialog, layer: top", () => {
  const make = (config: Record<string, unknown> = {}) => {
    const dialog = createDialog({ title: "Discard?", content: "Lost", layer: "top", ...config });
    const closes: unknown[] = [];
    dialog.on("close", (event) => closes.push(event));
    return { dialog, closes };
  };

  test("the dialog is a <dialog> in the container, without the overlay", () => {
    const { dialog } = make();
    expect(dialog.element.localName).toBe("dialog");
    expect(dialog.element.parentElement).toBe(document.body);
    expect(dialog.overlay.isConnected).toBe(false);
    expect(dialog.element.getAttribute("role")).toBe("alertdialog");
  });

  test("open() shows it with showModal() at once, and close() closes it once and keeps it in place", async () => {
    const { dialog, closes } = make();
    const opened: string[] = [];
    dialog.on("open", () => { opened.push("open"); });
    dialog.open();
    expect(calls).toEqual(["showModal"]);
    expect(dialog.element.hasAttribute("open")).toBe(true);
    // Synchronous in the top layer: state and event are there on return (FLO-543)
    expect(dialog.isOpen()).toBe(true);
    expect(opened).toEqual(["open"]);
    dialog.close();
    expect(calls).toEqual(["showModal", "close"]);
    await after(400);
    expect(closes.length).toBe(1);
    expect(dialog.element.isConnected).toBe(true);
    expect(dialog.overlay.isConnected).toBe(false);
  });

  test("Escape reaches it as cancel: it closes once, the browser's own close is refused", async () => {
    const { dialog, closes } = make();
    dialog.open();
    // A later key press. A cancel in the task open() ran in is the one the
    // browser sends for the key that opened the dialog, which never closes it
    // (FLO-548, dialog/open-contract.test.ts).
    await after(0);
    const event = escape(dialog.element);
    expect(event.defaultPrevented).toBe(true);
    expect(dialog.isOpen()).toBe(false);
    await after(10);
    expect(closes.length).toBe(1);
  });

  test("closeOnEscape: false refuses the cancel and stays open", () => {
    const { dialog, closes } = make({ closeOnEscape: false });
    dialog.open();
    expect(escape(dialog.element).defaultPrevented).toBe(true);
    expect(dialog.isOpen()).toBe(true);
    expect(closes.length).toBe(0);
  });

  test("a press and release on the backdrop, outside the dialog's box, closes it", () => {
    const { dialog, closes } = make();
    dialog.open();
    dialog.element.getBoundingClientRect = () =>
      ({ top: 100, bottom: 300, left: 100, right: 400, width: 300, height: 200, x: 100, y: 100 }) as DOMRect;
    const at = (type: string, x: number) =>
      dialog.element.dispatchEvent(new dom.window.MouseEvent(type, { bubbles: true, clientX: x, clientY: 200 }));
    at("mousedown", 200);
    at("mouseup", 200);
    expect(dialog.isOpen()).toBe(true);
    at("mousedown", 20);
    at("mouseup", 20);
    expect(dialog.isOpen()).toBe(false);
    expect(closes.length).toBe(1);
  });

  test("a close the browser makes on its own goes through close()", async () => {
    const { dialog, closes } = make();
    dialog.open();
    platformClose(dialog.element);
    expect(dialog.isOpen()).toBe(false);
    await after(10);
    expect(closes.length).toBe(1);
  });

  test("without the option it is unchanged: a div in the overlay, no showModal()", async () => {
    const dialog = createDialog({ title: "Discard?" });
    expect(dialog.element.localName).toBe("div");
    expect(dialog.element.parentElement).toBe(dialog.overlay);
    dialog.open();
    await after(30);
    expect(dialog.isOpen()).toBe(true);
    expect(calls).toEqual([]);
    dialog.close();
  });

  test("without showModal() support the option does nothing", () => {
    removeDialog();
    const dialog = createDialog({ title: "Discard?", layer: "top" });
    expect(dialog.element.localName).toBe("div");
    expect(dialog.element.parentElement).toBe(dialog.overlay);
  });
});

/** What these tests use of either sheet. */
interface Sheet {
  element: HTMLElement;
  open: () => unknown;
  close: () => unknown;
  isOpen: () => boolean;
  on: (event: "close", handler: () => void) => unknown;
}
type SheetFactory = (config: Record<string, unknown>) => Sheet;

describe.each([
  ["bottom sheet", createBottomSheet as SheetFactory, "bottom-sheet"],
  ["side sheet", createSideSheet as SheetFactory, "side-sheet"],
] as const)("%s, layer: top", (_name, create, block) => {
  const make = (config: Record<string, unknown> = {}) => {
    const sheet = create({ title: "Share", layer: "top", ...config });
    const closes: unknown[] = [];
    sheet.on("close", () => closes.push(null));
    return { sheet, closes };
  };
  const scrim = (root: HTMLElement) => root.querySelector(`.mtrl-${block}__scrim`);

  test("a modal sheet's root is a <dialog> with no scrim element, shown with showModal()", () => {
    const { sheet } = make();
    expect(sheet.element.localName).toBe("dialog");
    expect(scrim(sheet.element)).toBeNull();
    sheet.open();
    expect(calls).toEqual(["showModal"]);
    expect(sheet.isOpen()).toBe(true);
    sheet.close();
    expect(calls).toEqual(["showModal", "close"]);
    expect(sheet.element.isConnected).toBe(true);
  });

  test("Escape reaches it as cancel and closes it once", async () => {
    const { sheet, closes } = make();
    sheet.open();
    expect(escape(sheet.element).defaultPrevented).toBe(true);
    expect(sheet.isOpen()).toBe(false);
    await after(10);
    expect(closes.length).toBe(1);
  });

  test("closeOnEscape: false refuses the cancel", () => {
    const { sheet } = make({ closeOnEscape: false });
    sheet.open();
    expect(escape(sheet.element).defaultPrevented).toBe(true);
    expect(sheet.isOpen()).toBe(true);
  });

  test("a click on the root beside the sheet is the scrim's, and closes it", () => {
    const { sheet, closes } = make();
    sheet.open();
    sheet.element.querySelector(`.mtrl-${block}__content`)?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    expect(sheet.isOpen()).toBe(true);
    sheet.element.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    expect(sheet.isOpen()).toBe(false);
    expect(closes.length).toBe(1);
  });

  test("a close the browser makes on its own closes the sheet once", async () => {
    const { sheet, closes } = make();
    sheet.open();
    platformClose(sheet.element);
    expect(sheet.isOpen()).toBe(false);
    await after(10);
    expect(closes.length).toBe(1);
  });

  test("a standard sheet ignores the option, and without it a modal sheet is unchanged", () => {
    const standard = create({ variant: "standard", layer: "top" });
    expect(standard.element.localName).toBe("div");
    const modal = create({});
    expect(modal.element.localName).toBe("div");
    expect(scrim(modal.element)).not.toBeNull();
    modal.open();
    standard.open();
    expect(calls).toEqual([]);
  });
});

describe("modal drawer, layer: top", () => {
  const make = (config: Record<string, unknown> = {}) => {
    const drawer = createDrawer({ variant: "modal", layer: "top", items: [{ id: "a", label: "Inbox" }], ...config });
    document.body.append(drawer.element);
    const closes: unknown[] = [];
    drawer.on("close", () => closes.push(null));
    return { drawer, closes };
  };

  test("the root is a <dialog> with no scrim element, shown with showModal()", () => {
    const { drawer } = make();
    expect(drawer.element.localName).toBe("dialog");
    expect(drawer.element.querySelector(".mtrl-drawer__scrim")).toBeNull();
    drawer.open();
    expect(calls).toEqual(["showModal"]);
    drawer.close();
    expect(calls).toEqual(["showModal", "close"]);
  });

  test("the page is left to showModal(): no inert attribute on the drawer's siblings", () => {
    const sibling = document.createElement("main");
    document.body.prepend(sibling);
    const { drawer } = make();
    drawer.open();
    expect(sibling.hasAttribute("inert")).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
    drawer.close();
    expect(document.body.style.overflow).toBe("");
  });

  test("Escape reaches it as cancel and closes it once; a click beside the sheet does too", async () => {
    const { drawer, closes } = make();
    drawer.open();
    expect(escape(drawer.element).defaultPrevented).toBe(true);
    expect(drawer.isOpen()).toBe(false);
    drawer.open();
    drawer.element.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    expect(drawer.isOpen()).toBe(false);
    await after(10);
    expect(closes.length).toBe(2);
  });

  test("dismissible: false refuses the cancel and the backdrop", () => {
    const { drawer } = make({ dismissible: false });
    drawer.open();
    expect(escape(drawer.element).defaultPrevented).toBe(true);
    drawer.element.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    expect(drawer.isOpen()).toBe(true);
  });

  test("a close the browser makes on its own closes the drawer once", async () => {
    const { drawer, closes } = make();
    drawer.open();
    platformClose(drawer.element);
    expect(drawer.isOpen()).toBe(false);
    await after(10);
    expect(closes.length).toBe(1);
  });

  test("opened before it is on the page, it is shown once it is", async () => {
    const drawer = createDrawer({ variant: "modal", layer: "top", open: true, items: [{ id: "a", label: "Inbox" }] });
    expect(calls).toEqual([]);
    document.body.append(drawer.element);
    await after(10);
    expect(calls).toEqual(["showModal"]);
  });

  test("a standard drawer ignores the option, and without it a modal drawer is unchanged", () => {
    const sibling = document.createElement("main");
    document.body.prepend(sibling);
    const standard = createDrawer({ layer: "top" });
    expect(standard.element.localName).toBe("aside");
    const modal = createDrawer({ variant: "modal" });
    document.body.append(modal.element);
    expect(modal.element.localName).toBe("aside");
    expect(modal.element.querySelector(".mtrl-drawer__scrim")).not.toBeNull();
    modal.open();
    expect(sibling.hasAttribute("inert")).toBe(true);
    expect(calls).toEqual([]);
    modal.close();
  });
});
