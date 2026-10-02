// scripts/check-elements-registry.ts
// FLO-380: every registered element has an explicit browser case. Model cases
// compare the notification with the live getter inside the dispatch handler.
import assert from "node:assert/strict";
import type { Page } from "playwright";

type Case = {
  markup?: string;
  event?: string;
  getter?: "value" | "checked" | "index" | "component";
  factoryEvent?: string;
  factoryPath?: "picker";
  action?: string;
  changesTo?: string | number;
};

const icon = '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>';
const choices = (parent: string, child: string): string =>
  `<m-${parent} value="a"><m-${child} value="a">Alpha</m-${child}><m-${child} value="b">Beta</m-${child}></m-${parent}>`;
const click = (selector: string): string => `host.shadowRoot.querySelector(${JSON.stringify(selector)}).click()`;

const cases: Record<string, Case> = {
  button: { markup: '<m-button value="save">Save</m-button>', event: "change", getter: "component", factoryEvent: "change", action: click("button") },
  switch: { event: "change", getter: "checked", factoryEvent: "change", action: click("input") },
  tabs: { markup: choices("tabs", "tab"), event: "change", getter: "value", factoryEvent: "change", action: `host.component.getTabs()[1].element.click()` },
  progress: {}, loadingIndicator: {}, badge: {}, divider: {},
  iconButton: { markup: `<m-icon-button toggle value="favorite" aria-label="Favorite" icon='${icon}'></m-icon-button>`, event: "change", getter: "component", factoryEvent: "change", action: click("button") },
  fab: {}, extendedFab: {},
  checkbox: { event: "change", getter: "checked", factoryEvent: "change", action: click("input") },
  slider: { markup: '<m-slider value="40" aria-label="Level"></m-slider>', event: "change", getter: "value", factoryEvent: "change", changesTo: 41, action: `const slider = host.shadowRoot.querySelector('[role="slider"]'); slider.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))` },
  textfield: { event: "input", getter: "value", factoryEvent: "input", action: `const input = host.shadowRoot.querySelector("input"); input.value = "Ada"; input.dispatchEvent(new Event("input", { bubbles: true }))` },
  radios: { markup: choices("radios", "radio"), event: "change", getter: "value", factoryEvent: "change", action: `host.component.radios[1].input.click()` },
  navigationBar: { markup: `<m-navigation-bar><m-navigation-bar-item value="a" icon='${icon}'>Alpha</m-navigation-bar-item><m-navigation-bar-item value="b" icon='${icon}'>Beta</m-navigation-bar-item></m-navigation-bar>`, event: "change", getter: "value", factoryEvent: "select", action: click('[data-id="b"]') },
  navigationRail: { markup: `<m-navigation-rail><m-navigation-rail-item value="a" icon='${icon}'>Alpha</m-navigation-rail-item><m-navigation-rail-item value="b" icon='${icon}'>Beta</m-navigation-rail-item></m-navigation-rail>`, event: "change", getter: "value", factoryEvent: "select", action: click('[data-id="b"]') },
  drawer: { markup: choices("drawer", "drawer-item"), event: "change", getter: "value", factoryEvent: "select", action: click('[data-id="b"]') },
  topAppBar: {}, bottomAppBar: {},
  buttonGroup: { markup: '<m-button-group selection="single" value="a"><m-button-group-item value="a">Alpha</m-button-group-item><m-button-group-item value="b">Beta</m-button-group-item></m-button-group>', event: "change", getter: "value", factoryEvent: "change", action: `host.component.buttons[1].element.click()` },
  chips: { markup: choices("chips", "chip"), event: "change", getter: "value", factoryEvent: "change", action: `host.component.getChips()[1].element.click()` },
  list: { markup: choices("list", "list-item"), event: "change", getter: "value", action: click('[data-id="b"]') },
  card: {},
  carousel: { markup: choices("carousel", "carousel-item"), event: "change", getter: "index", factoryEvent: "change", action: `host.next()` },
  menu: {}, fabMenu: {},
  select: { markup: choices("select", "select-option"), event: "change", getter: "value", factoryEvent: "change", action: `host.component[Object.getOwnPropertySymbols(host.component).find(key => key.description === "mtrl.menu")].element.querySelector('[data-id="b"]').click()` },
  splitButton: {}, tooltip: {}, toolbar: {}, snackbar: {}, dialog: {}, bottomSheet: {}, sideSheet: {},
  datepicker: { markup: '<m-datepicker label="Date" value="2026-09-10"></m-datepicker>', event: "change", getter: "value", factoryEvent: "change", action: `const input = host.shadowRoot.querySelector("input"); input.value = "09/12/2026"; input.dispatchEvent(new Event("change", { bubbles: true }))` },
  timepicker: { markup: '<m-timepicker value="09:30"></m-timepicker>', event: "confirm", getter: "value", factoryEvent: "confirm", factoryPath: "picker", changesTo: "10:30", action: `const picker = host.component.picker; picker.setType("input"); picker.open(); const hour = picker.dialogElement.querySelector('[data-type="hour"]'); hour.value = "10"; hour.dispatchEvent(new Event("change", { bubbles: true })); picker.dialogElement.querySelector('[class$="time-picker__confirm"]').click()` },
  search: { event: "input", getter: "value", factoryEvent: "input", action: `const input = host.shadowRoot.querySelector("input"); input.value = "Ada"; input.dispatchEvent(new Event("input", { bubbles: true }))` },
};

const declarations: Record<string, string> = {
  tab: "tabs", radio: "radios", navigationBarItem: "navigationBar", navigationRailItem: "navigationRail",
  drawerItem: "drawer", buttonGroupItem: "buttonGroup", chip: "chips", listItem: "list",
  carouselItem: "carousel", menuItem: "menu", fabMenuItem: "fabMenu", selectOption: "select",
  searchSuggestion: "search",
};

export const checkRegistryEvents = async (
  page: Page,
  fresh: (page: Page, markup: string) => Promise<void>,
  check: (name: string) => void,
): Promise<void> => {
  const registered = await page.evaluate(() => {
    type Registry = Record<string, { spec: { name: string } }>;
    const mtrl = (window as unknown as { mtrl: { elements: Registry; declarations: Registry } }).mtrl;
    return { elements: Object.keys(mtrl.elements).sort(), declarations: Object.keys(mtrl.declarations).sort() };
  });
  assert.deepEqual(Object.keys(cases).sort(), registered.elements, "add a case when registering an element");
  assert.deepEqual(Object.keys(declarations).sort(), registered.declarations, "add a declaration-child case when registering one");

  for (const [name, item] of Object.entries(cases)) {
    const tag = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    if (name === "button") await page.evaluate(() => {
      const mtrl = (window as unknown as { mtrl: { setComponentDefaults: (name: string, defaults: object) => void } }).mtrl;
      mtrl.setComponentDefaults("button", { toggle: true });
    });
    await fresh(page, item.markup ?? `<m-${tag}></m-${tag}>`);
    const result = await page.evaluate(async ({ name, tag, item }) => {
      type Component = { on?: (event: string, listener: (payload: { value: unknown }) => void) => void; getValue?: () => unknown; setType?: (type: string) => void; picker?: Component };
      const host = document.querySelector(`m-${tag}`) as HTMLElement & { component?: Component; value?: unknown; checked?: boolean; index?: number };
      const spec = (window as unknown as { mtrl: { elements: Record<string, { spec: { model?: string } }> } }).mtrl.elements[name].spec;
      const mounted = !!host && !!customElements.get(`m-${tag}`) && !!host.shadowRoot && !!host.component;
      if (!item.event || !item.action) {
        const modelEvents: string[] = [];
        for (const name of ["change", "input", "confirm"]) {
          host.addEventListener(name, event => { if (event instanceof CustomEvent) modelEvents.push(name); });
        }
        (host.shadowRoot?.querySelector("button,input") as HTMLElement | null)?.click();
        await new Promise(resolve => setTimeout(resolve, 30));
        return { mounted, model: spec.model ?? null, element: [] as boolean[], factory: [] as boolean[], modelEvents, before: null as unknown, after: null as unknown };
      }
      const element: boolean[] = [];
      const factory: boolean[] = [];
      const target = item.factoryPath === "picker" ? host.component?.picker : host.component;
      const getter = (): unknown => item.getter === "component" ? host.component?.getValue?.() : host[item.getter as "value" | "checked" | "index"];
      const before = item.changesTo === undefined ? null : getter();
      host.addEventListener(item.event, event => {
        if (!(event instanceof CustomEvent)) return;
        element.push("value" in Object(event.detail) && JSON.stringify(event.detail.value) === JSON.stringify(getter()));
      });
      if (item.factoryEvent && target?.on && target.getValue) {
        target.on(item.factoryEvent, payload => factory.push("value" in Object(payload) && JSON.stringify(payload.value) === JSON.stringify(target.getValue?.())));
      }
      await (new Function("host", `return (async () => { ${item.action} })()`)(host) as Promise<void>);
      await new Promise(resolve => setTimeout(resolve, 70));
      return { mounted, model: spec.model ?? null, element, factory, modelEvents: [] as string[], before, after: item.changesTo === undefined ? null : getter() };
    }, { name, tag, item });
    assert.equal(result.mounted, true, `${name}: mounted as an upgraded custom element`);
    if (item.event) {
      assert.ok(result.element.length, `${name}: ${item.event} dispatched`);
      assert.ok(result.element.every(Boolean), `${name}: detail.value equals its getter during dispatch`);
      if (item.factoryEvent) {
        assert.ok(result.factory.length, `${name}: factory ${item.factoryEvent} dispatched`);
        assert.ok(result.factory.every(Boolean), `${name}: factory value equals getValue during dispatch`);
      }
      if (item.changesTo !== undefined) {
        assert.notDeepEqual(result.after, result.before, `${name}: action changes the model`);
        assert.deepEqual(result.after, item.changesTo, `${name}: action reaches the expected value`);
      }
    } else {
      assert.equal(result.model, null, `${name}: no element model notification`);
      assert.deepEqual(result.modelEvents, [], `${name}: a default click emits no model notification`);
    }
    check(`registry: ${name} ${item.event ? "model event" : "non-model mount"}${item.changesTo === undefined ? "" : ` ${JSON.stringify(result.before)} → ${JSON.stringify(result.after)}`}`);
    if (name === "button") await page.evaluate(() => {
      const mtrl = (window as unknown as { mtrl: { setComponentDefaults: (name: string, defaults: object) => void } }).mtrl;
      mtrl.setComponentDefaults("button", {});
    });
  }

  for (const [name, parentName] of Object.entries(declarations)) {
    const tag = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    const parent = parentName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    const requiredIcon = name === "navigationBarItem" || name === "navigationRailItem" ? ` icon='${icon}'` : "";
    await fresh(page, `<m-${parent}><m-${tag} value="child"${requiredIcon}>Child</m-${tag}></m-${parent}>`);
    const observed = await page.evaluate(({ tag, parent, name }) => {
      const host = document.querySelector(`m-${parent}`) as HTMLElement & { component?: {
        getOptions?: () => Array<{ text: string }>;
        getSuggestions?: () => Array<{ text: string }>;
      } };
      const child = host.querySelector(`m-${tag}`);
      const parsed = name === "selectOption" ? host.component?.getOptions?.().some(option => option.text === "Child")
        : name === "searchSuggestion" ? host.component?.getSuggestions?.().some(option => option.text === "Child")
        : host.shadowRoot?.textContent?.includes("Child");
      return !!customElements.get(`m-${tag}`) && child?.constructor !== HTMLElement && !!host.component &&
        !!host.shadowRoot && parsed;
    }, { tag, parent, name });
    assert.equal(observed, true, `${name}: upgraded within ${parentName}`);
    check(`registry: ${name} declarative child`);
  }
};
