// A config on* option is the same listener as on(event): same calls, same payload.
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import {
  createChips,
  createFilterChip,
  createInputChip,
  type ChipChangePayload,
  type ChipComponent,
  type ChipEvents,
  type ChipsChangeEvent,
  type ChipsComponent,
  type ChipsConfig,
} from "../../../src/components/chips";
import { expectSameListener, optionPair } from "../on-option-pair";

let dom: JSDOM;
let chips: ChipComponent[];
let sets: ChipsComponent[];
beforeEach(() => {
  dom = new JSDOM("<!DOCTYPE html><body></body>", { url: "http://localhost/", pretendToBeVisual: true });
  Object.assign(globalThis, {
    window: dom.window, document: dom.window.document,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node,
    Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  });
  chips = [];
  sets = [];
});
afterEach(() => {
  for (const set of sets) {
    for (const chip of set.getChips()) chip.destroy();
    set.destroy();
  }
  for (const chip of chips) chip.destroy();
  dom.window.close();
});
const mountChip = <T extends ChipComponent>(chip: T) => {
  chips.push(chip);
  document.body.append(chip.element);
  return chip;
};
const mountSet = (config: ChipsConfig) => {
  const set = createChips(config);
  sets.push(set);
  document.body.append(set.element);
  return set;
};

describe("chips set onChange is an on(change) listener", () => {
  test("a click and selectByValue(value, true) call onChange and on(change) once each, with the same object", () => {
    for (const multiSelect of [false, true]) {
      const seen = optionPair();
      const set = mountSet({
        multiSelect,
        chips: [{ value: "a", ripple: false }, { value: "b", ripple: false }],
        onChange: event => seen.option(event),
      });
      set.on("change", event => seen.listener(event));

      set.getChips()[0]!.element.click();
      set.selectByValue("b", true);

      expectSameListener(seen);
      expect(seen.optionCalls).toHaveLength(2);
      expect(seen.optionCalls.map(event => ({ ...(event as ChipsChangeEvent) }))).toEqual([
        { value: multiSelect ? ["a"] : "a", selected: ["a"], changed: "a" },
        {
          value: multiSelect ? ["a", "b"] : "b",
          selected: multiSelect ? ["a", "b"] : ["b"],
          changed: null,
        },
      ]);
    }
  });

  test("onChange is registered before the on map and before a listener added later", () => {
    const order: string[] = [];
    const set = mountSet({
      chips: [{ value: "a", ripple: false }],
      on: { change: () => order.push("map") },
      onChange: () => order.push("option"),
    });
    set.on("change", () => order.push("later"));
    set.getChips()[0]!.element.click();
    expect(order).toEqual(["option", "map", "later"]);
  });

  test("off(change) drops onChange, and selectByValue without the flag stays silent", () => {
    const calls: string[] = [];
    const onChange = () => calls.push("option");
    const listener = () => calls.push("listener");
    const set = mountSet({
      multiSelect: false,
      chips: [{ value: "a", ripple: false }, { value: "b", ripple: false }],
      onChange,
    });
    set.on("change", listener);
    expect(set.off("change", onChange).off("change", listener)).toBe(set);
    set.getChips()[0]!.element.click();
    set.selectByValue("b");
    set.selectByValue("b", true);
    expect(calls).toEqual([]);
    expect(set.getSelectedValues()).toEqual(["b"]);
  });

  test("an onChange that selectByValue(value, true) the same value stops at the second call", () => {
    const values: unknown[] = [];
    let set!: ChipsComponent;
    set = mountSet({
      multiSelect: false,
      chips: [{ value: "a", ripple: false }, { value: "b", ripple: false }],
      onChange: event => {
        values.push(event.value);
        if (values.length > 2) throw new Error("loop");
        set.selectByValue("a", true);
      },
    });
    set.getChips()[1]!.element.click();
    expect(values).toEqual(["b", "a"]);
    expect(set.getValue()).toBe("a");
  });

  test("a listener that destroys the set is not followed by a later handler, and teardown calls nothing", () => {
    const calls: string[] = [];
    let set!: ChipsComponent;
    set = mountSet({
      chips: [{ value: "a", ripple: false }, { value: "b", ripple: false }],
      onChange: () => calls.push("onChange"),
      on: {
        change: () => {
          calls.push("map");
          set.destroy();
        },
      },
    });
    set.on("change", () => calls.push("later"));
    expect(() => set.getChips()[0]!.element.click()).not.toThrow();
    expect(calls).toEqual(["onChange", "map"]);
    calls.length = 0;
    expect(() => set.selectByValue("b", true)).not.toThrow();
    expect(() => set.destroy()).not.toThrow();
    expect(calls).toEqual([]);
  });
});

describe("a chip alone: on* options are the event listeners", () => {
  test("onChange matches the change listener for a click, including a leftover (selected, chip)", () => {
    const seen = optionPair();
    const leftover: { length: number; selected: unknown; chip: unknown }[] = [];
    const chip = mountChip(createFilterChip({
      label: "Filter",
      value: "f",
      ripple: false,
      onChange: (payload) => seen.option(payload),
    }));
    chip.on("change", (payload) => seen.listener(payload));
    const old = mountChip(createFilterChip({
      label: "Old",
      value: "old",
      ripple: false,
      onChange: function (selected: unknown, instance: unknown) {
        leftover.push({ length: arguments.length, selected, chip: instance });
      } as ChipEvents["change"],
    }));

    chip.action.click();
    chip.action.click();
    old.action.click();
    old.action.click();

    expectSameListener(seen);
    expect(seen.optionCalls).toEqual([
      { selected: true, chip, value: "f" },
      { selected: false, chip, value: "f" },
    ]);
    expect(leftover).toEqual([
      { length: 1, selected: { selected: true, chip: old, value: "old" }, chip: undefined },
      { length: 1, selected: { selected: false, chip: old, value: "old" }, chip: undefined },
    ]);
    chip.setSelected(true);
    expect(seen.optionCalls).toHaveLength(2);
  });

  test("onClick matches the click listener, including a leftover that expected the chip", () => {
    const seen = optionPair();
    let leftover: { length: number; first: unknown; second: unknown } | undefined;
    const chip = mountChip(createFilterChip({
      label: "Filter",
      ripple: false,
      onClick: (payload) => seen.option(payload),
    }));
    chip.on("click", (payload) => seen.listener(payload));
    const old = mountChip(createAssistChipStandIn());
    function createAssistChipStandIn() {
      return createFilterChip({
        label: "Old",
        ripple: false,
        onClick: function (first: unknown, second: unknown) {
          leftover = { length: arguments.length, first, second };
        } as ChipEvents["click"],
      });
    }
    old.action.click();
    chip.action.click();

    expectSameListener(seen);
    expect(seen.optionCalls).toHaveLength(1);
    const payload = seen.optionCalls[0] as { event: MouseEvent; originalEvent: MouseEvent; element: HTMLElement };
    expect(payload.element).toBe(chip.element);
    expect(payload.event).toBe(payload.originalEvent);
    expect(payload.event.type).toBe("click");
    expect(leftover?.length).toBe(1);
    expect(leftover?.second).toBeUndefined();
    const first = leftover?.first as { element?: HTMLElement; focus?: unknown };
    expect(first.element).toBe(old.element);
    expect(first.focus).toBeUndefined();
  });

  test("onRemove matches the remove listener and is registered before a later one", () => {
    const seen = optionPair();
    const chip = mountChip(createInputChip({
      label: "Ada",
      ripple: false,
      onRemove: (instance) => seen.option(instance),
    }));
    chip.on("remove", (instance) => seen.listener(instance));
    chip.element.querySelector<HTMLButtonElement>(".mtrl-chip__remove")!.click();
    expectSameListener(seen);
    expect(seen.optionCalls).toEqual([chip]);
  });

  test("onTrailingClick matches the trailing listener and is registered before a later one", () => {
    const seen = optionPair();
    const chip = mountChip(createFilterChip({
      label: "Price",
      ripple: false,
      onTrailingClick: (instance) => seen.option(instance),
    }));
    chip.on("trailing", (instance) => seen.listener(instance));
    chip.trailingAction!.click();
    expectSameListener(seen);
    expect(seen.optionCalls).toEqual([chip]);
  });

  test("onSelect still receives the chip and has no event of its own", () => {
    const selected: ChipComponent[] = [];
    const chip = mountChip(createFilterChip({
      label: "Filter",
      ripple: false,
      onSelect: (instance) => selected.push(instance),
    }));
    const names: string[] = [];
    chip.on("change", () => names.push("change"));
    chip.action.click();
    expect(selected).toEqual([chip]);
    expect(names).toEqual(["change"]);
    expect("select" in chip).toBe(false);
  });
});

describe("a chip inside a set emits its own change", () => {
  test("a click calls the item onChange once with the change payload, in order", () => {
    const order: string[] = [];
    const option: unknown[][] = [];
    const listener: ChipChangePayload[] = [];
    const set = mountSet({
      chips: [{
        value: "a",
        ripple: false,
        onClick: () => order.push("item onClick"),
        onChange: (...args: unknown[]) => {
          order.push("item onChange");
          option.push(args);
        },
        onSelect: () => order.push("item onSelect"),
      }],
      onChange: () => order.push("set onChange"),
    });
    const chip = set.getChips()[0]!;
    set.on("change", () => order.push("set change"));
    chip.on("click", () => order.push("chip click"));
    chip.on("change", payload => {
      order.push("chip change");
      listener.push(payload);
    });

    chip.element.click();
    chip.element.click();

    const args = option.map((call, index) => {
      const first = call[0];
      if (typeof first === "object" && first && "selected" in first && "chip" in first && "value" in first) {
        const payload = first as ChipChangePayload;
        return {
          length: call.length,
          selected: payload.selected,
          value: payload.value,
          chip: payload.chip === chip,
          listener: payload === listener[index],
        };
      }
      return { length: call.length, first: typeof first, second: typeof call[1] };
    });
    const step = [
      "item onClick",
      "set onChange",
      "set change",
      "item onSelect",
      "chip click",
      "item onChange",
      "chip change",
    ];
    expect({ order, args }).toEqual({
      order: [...step, ...step],
      args: [
        { length: 1, selected: true, value: "a", chip: true, listener: true },
        { length: 1, selected: false, value: "a", chip: true, listener: true },
      ],
    });
  });

  test("a leftover (selected, chip) handler receives the change payload as its first argument", () => {
    const leftover: { length: number; selected: unknown; chip: unknown }[] = [];
    const listener: ChipChangePayload[] = [];
    const set = mountSet({
      chips: [{
        value: "old",
        ripple: false,
        onChange: function (selected: unknown, instance: unknown) {
          leftover.push({ length: arguments.length, selected, chip: instance });
        } as ChipEvents["change"],
      }],
    });
    const chip = set.getChips()[0]!;
    chip.on("change", payload => listener.push(payload));
    chip.element.click();
    chip.element.click();
    const described = leftover.map((call, index) => {
      const payload = call.selected;
      const object = typeof payload === "object" && payload && "selected" in payload && "value" in payload
        ? payload as ChipChangePayload
        : undefined;
      return {
        length: call.length,
        second: call.chip === undefined,
        same: object !== undefined && object === listener[index],
        selected: object ? object.selected : payload,
        value: object ? object.value : undefined,
        chip: object ? object.chip === chip : false,
      };
    });
    expect(described).toEqual([
      { length: 1, second: true, same: true, selected: true, value: "old", chip: true },
      { length: 1, second: true, same: true, selected: false, value: "old", chip: true },
    ]);
  });

  test("single-select emits change once on the clicked chip, not on the chip it replaces", () => {
    const order: string[] = [];
    const set = mountSet({
      multiSelect: false,
      chips: [
        {
          value: "a",
          ripple: false,
          selected: true,
          onChange: () => order.push("a onChange"),
        },
        {
          value: "b",
          ripple: false,
          onChange: () => order.push("b onChange"),
        },
      ],
    });
    const [replaced, clicked] = set.getChips();
    replaced!.on("change", () => order.push("a change"));
    clicked!.on("change", () => order.push("b change"));
    clicked!.element.click();
    expect(order).toEqual(["b onChange", "b change"]);
    expect(replaced!.isSelected()).toBe(false);
    expect(clicked!.isSelected()).toBe(true);
    clicked!.element.click();
    expect(order).toEqual(["b onChange", "b change", "b onChange", "b change"]);
  });

  test("selectByValue(value, true) and setSelected do not emit the chip's change", () => {
    const chipChange: string[] = [];
    const setChange: string[] = [];
    const set = mountSet({
      multiSelect: false,
      chips: [
        { value: "a", ripple: false, selected: true, onChange: () => chipChange.push("a option") },
        { value: "b", ripple: false, onChange: () => chipChange.push("b option") },
      ],
      onChange: () => setChange.push("set"),
    });
    const [first, second] = set.getChips();
    first!.on("change", () => chipChange.push("a listener"));
    second!.on("change", () => chipChange.push("b listener"));

    set.selectByValue("b", true);
    expect(chipChange).toEqual([]);
    expect(setChange).toEqual(["set"]);
    expect(second!.isSelected()).toBe(true);
    expect(first!.isSelected()).toBe(false);

    chipChange.length = 0;
    setChange.length = 0;
    first!.setSelected(true);
    expect(chipChange).toEqual([]);
    expect(setChange).toEqual([]);
    expect(first!.isSelected()).toBe(true);
    expect(second!.isSelected()).toBe(false);
  });

  // FLO-550: "emit only when something changed" is part of the contract.
  test("a refused deselect emits no change, on the chip or on the set, and calls no onSelect; the click is still reported", () => {
    for (const multiSelect of [false, true]) {
      const calls: string[] = [];
      const set = mountSet({
        multiSelect,
        selectionRequired: true,
        chips: [{
          value: "a",
          ripple: false,
          selected: true,
          onChange: () => calls.push("item onChange"),
          onClick: () => calls.push("item onClick"),
          onSelect: () => calls.push("item onSelect"),
        }],
        onChange: () => calls.push("set onChange"),
      });
      const chip = set.getChips()[0]!;
      chip.on("change", () => calls.push("chip change"));
      chip.on("click", () => calls.push("chip click"));
      set.on("change", () => calls.push("set change"));
      chip.element.click();
      expect(chip.isSelected()).toBe(true);
      expect(set.getSelectedValues()).toEqual(["a"]);
      expect(calls).toEqual(["item onClick", "chip click"]);
    }
  });
});

describe("click, then change: one order, alone and in a set", () => {
  test("a chip alone: onClick and click run before the toggle, onChange and change after it", () => {
    const seen: string[] = [];
    const chip: ChipComponent = mountChip(createFilterChip({
      label: "Filter",
      ripple: false,
      onClick: () => seen.push(`onClick ${chip.isSelected()}`),
      onChange: payload => seen.push(`onChange ${chip.isSelected()} ${payload.selected}`),
    }));
    chip.on("click", () => seen.push(`click ${chip.isSelected()}`));
    chip.on("change", () => seen.push(`change ${chip.isSelected()}`));
    chip.element.click();
    chip.element.click();
    expect(seen).toEqual([
      "onClick false", "click false", "onChange true true", "change true",
      "onClick true", "click true", "onChange false false", "change false",
    ]);
  });

  test("a chip in a set: the item's onClick reads the state before the click, its onChange the new one", () => {
    const seen: string[] = [];
    const set = mountSet({
      chips: [{
        value: "a",
        ripple: false,
        onClick: () => seen.push(`onClick ${set.getChips()[0]!.isSelected()}`),
        onChange: payload => seen.push(`onChange ${set.getChips()[0]!.isSelected()} ${payload.selected}`),
      }],
    });
    set.getChips()[0]!.element.click();
    set.getChips()[0]!.element.click();
    expect(seen).toEqual(["onClick false", "onChange true true", "onClick true", "onChange false false"]);
  });
});

describe("removing a chip in a set", () => {
  test("remove listeners and onRemove run once, with the chip still listed and connected; the set removes it after", () => {
    const seen: string[] = [];
    const set = mountSet({
      chips: [
        { type: "input", value: "a", label: "A", ripple: false, onRemove: chip => seen.push(`onRemove ${set.getChips().includes(chip)} ${chip.element.isConnected}`) },
        { type: "input", value: "b", label: "B", ripple: false },
      ],
    });
    const chip = set.getChips()[0]!;
    chip.on("remove", instance => seen.push(`remove ${instance === chip} ${set.getChips().includes(instance)} ${instance.element.isConnected}`));
    set.on("remove", () => seen.push(`set remove ${set.getChips().includes(chip)} ${chip.element.isConnected}`));
    chip.element.querySelector<HTMLButtonElement>(".mtrl-chip__remove")!.click();
    expect(seen).toEqual(["onRemove true true", "remove true true true", "set remove false false"]);
    expect(set.getChips().map(item => item.getValue())).toEqual(["b"]);
    expect(chip.element.isConnected).toBe(false);
  });
});
