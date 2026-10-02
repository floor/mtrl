// test/types/host-attributes.fixture.ts
//
// FLO-519: a component accepts the host element's standard HTML attributes.
// The component's own props keep their types where the names collide, a wrong
// type for one of those still fails, and an attribute the framework does not
// know still fails. An event the component declares under a DOM event's name
// (`change`, `input`, `select`, `toggle`) keeps the element's CustomEvent:
// an inferred parameter can read `detail`, and a parameter annotated as a bare
// DOM Event cannot. Compiled under both strictNullChecks gates (tooling:check
// and test:types).
import type { ComponentProps as ReactProps } from "react";
import type { ComponentProps as SolidProps } from "solid-js";
import type { Button, IconButton, Menu, Switch, TextField } from "../../src/react";
import type { Button as SolidButton, IconButton as SolidIconButton, Menu as SolidMenu, Switch as SolidSwitch, TextField as SolidTextField } from "../../src/solid";
import { h, type FunctionalComponent } from "vue";
import { MChips, MIconButton, MMenu, MSwitch, MTextField, type MButton, type MTab, type VueProps } from "../../src/vue";
import type { SvelteProps } from "../../src/svelte/runtime";
import type { ButtonSpec, IconButtonSpec, MenuSpec, SwitchSpec, TextFieldSpec } from "../../src/elements";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <T extends true>(): T => true as T;

type ReactButton = ReactProps<typeof Button>;
export const reactHost: ReactButton = {
  popover: "auto",
  inputMode: "numeric",
  enterKeyHint: "send",
  itemProp: "name",
  nonce: "abc",
  label: "Save",
};
// The component's `type` stays its own string.
assert<Equals<ReactButton["type"], string | undefined>>();
// `defaultValue` stays the text field's string, not HTML's wider default.
assert<Equals<ReactProps<typeof TextField>["defaultValue"], string | undefined>>();
// @ts-expect-error -- popover is "", "auto", "manual" or "hint"
export const reactPopover: ReactButton = { popover: "nope" };
// @ts-expect-error -- variant is a string
export const reactVariant: ReactButton = { variant: 1 };
// @ts-expect-error -- not an HTML attribute
export const reactUnknown: ReactButton = { notARealAttribute: true };

type SolidButtonProps = SolidProps<typeof SolidButton>;
export const solidHost: SolidButtonProps = {
  popover: "auto",
  inputMode: "numeric",
  enterkeyhint: "send",
  itemProp: "name",
  nonce: "abc",
  label: "Save",
};
assert<Equals<SolidButtonProps["type"], string | undefined>>();
// @ts-expect-error -- Solid spells the attribute enterkeyhint
export const solidHint: SolidButtonProps = { enterKeyHint: "send" };
// @ts-expect-error -- variant is a string
export const solidVariant: SolidButtonProps = { variant: 1 };
// @ts-expect-error -- not an HTML attribute
export const solidUnknown: SolidButtonProps = { notARealAttribute: true };

type SvelteButton = SvelteProps<ButtonSpec>;
export const svelteHost: SvelteButton = {
  popover: "auto",
  inputmode: "numeric",
  enterkeyhint: "send",
  itemprop: "name",
  nonce: "abc",
  label: "Save",
};
assert<Equals<SvelteButton["type"], string | undefined>>();
// @ts-expect-error -- Svelte spells the attribute inputmode
export const svelteMode: SvelteButton = { inputMode: "numeric" };
// @ts-expect-error -- variant is a string
export const svelteVariant: SvelteButton = { variant: 1 };
// @ts-expect-error -- not an HTML attribute
export const svelteUnknown: SvelteButton = { notARealAttribute: true };

type VueButton = VueProps<ButtonSpec>;
export const vueHost: VueButton = {
  popover: "auto",
  inputmode: "numeric",
  enterKeyHint: "send",
  itemprop: "name",
  nonce: "abc",
  label: "Save",
  id: "save",
};
export const vueInstance: InstanceType<typeof MButton>["$props"] = {
  popover: "auto",
  inputmode: "numeric",
  enterKeyHint: "send",
  nonce: "abc",
};
assert<Equals<VueButton["type"], string | undefined>>();
// @ts-expect-error -- Vue spells the attribute inputmode
export const vueMode: VueButton = { inputMode: "numeric" };
// @ts-expect-error -- variant is a string
export const vueVariant: VueButton = { variant: 1 };
// @ts-expect-error -- popover is "", "auto", "manual" or "hint"
export const vuePopover: VueButton = { popover: "nope" };
// @ts-expect-error -- not an HTML attribute
export const vueUnknown: VueButton = { notARealAttribute: true };
type FnProps<C> = C extends FunctionalComponent<infer P> ? P : never;
// A declaration child accepts host attributes; its own attribute keeps its type.
export const vueTab: FnProps<typeof MTab> = { value: "a", id: "tab-a", popover: "auto" };
// @ts-expect-error -- value is a string
export const vueTabValue: FnProps<typeof MTab> = { value: 1 };

// The component's own events win over the host's handlers of the same name.
// An inferred parameter reads the element's `detail`. A `CustomEvent` annotation
// of that payload compiles. A parameter annotated as a bare DOM `Event` has no
// `detail`. A callback annotated `(event: Event) => void` still assigns: the
// component calls it with a CustomEvent, which is what `next` accepted.
// A host click the component does not emit stays the framework's mouse or pointer event.

type SwitchDetail = { checked: boolean; value: boolean; valueAttribute: string; nativeEvent: Event | undefined };

type ReactSwitch = ReactProps<typeof Switch>;
export const reactChange: ReactSwitch = {
  onChange: (event) => {
    assert<Equals<typeof event, CustomEvent<SwitchDetail>>>();
    const checked: boolean = event.detail.checked;
    return checked;
  },
};
export const reactChangeAnnotated: ReactSwitch = {
  onChange: (event: CustomEvent<{ value: boolean }>) => {
    const value: boolean = event.detail.value;
    return value;
  },
};
export const reactChangeEvent: ReactSwitch = {
  onChange: (event: Event) => {
    void event.type;
  },
};
export const reactChangeBare: ReactSwitch = {
  // @ts-expect-error -- Event has no detail; the payload is the component's CustomEvent
  onChange: (event: Event) => event.detail,
};
export const reactInput: ReactProps<typeof TextField> = {
  onInput: (event) => {
    const value: string = event.detail.value;
    return value;
  },
};
// 1.0 removed the icon button's own `toggle` event, and its onToggle is refused:
// it would otherwise fall through to the host's native handler, compile, and
// never fire for a toggle. The selected state comes with change. On a
// component that never had the event, onToggle stays the host's native one.
export const reactToggle: ReactProps<typeof IconButton> = {
  // @ts-expect-error -- onToggle is gone from the icon button: use onChange
  onToggle: () => {},
  onChange: (event) => {
    const selected: boolean = event.detail.selected;
    return selected;
  },
};
export const reactPlain: ReactProps<typeof Button> = {
  onToggle: (event) => {
    const state: string = event.newState;
    return state;
  },
};
export const reactSelect: ReactProps<typeof Menu> = {
  onSelect: (event) => {
    const value: string = event.detail.value;
    return value;
  },
};
export const reactClick: ReactSwitch = {
  onClick: (event) => {
    const x: number = event.clientX;
    return x;
  },
};

type SolidSwitchProps = SolidProps<typeof SolidSwitch>;
export const solidChange: SolidSwitchProps = {
  onChange: (event) => {
    assert<Equals<typeof event, CustomEvent<SwitchDetail>>>();
    const checked: boolean = event.detail.checked;
    return checked;
  },
};
export const solidChangeAnnotated: SolidSwitchProps = {
  onChange: (event: CustomEvent<{ value: boolean }>) => {
    const value: boolean = event.detail.value;
    return value;
  },
};
export const solidChangeEvent: SolidSwitchProps = {
  onChange: (event: Event) => {
    void event.type;
  },
};
export const solidChangeBare: SolidSwitchProps = {
  // @ts-expect-error -- Event has no detail; the payload is the component's CustomEvent
  onChange: (event: Event) => event.detail,
};
export const solidInput: SolidProps<typeof SolidTextField> = {
  onInput: (event) => {
    const value: string = event.detail.value;
    return value;
  },
};
// 1.0 removed the icon button's own `toggle` event, and its onToggle is refused:
// it would otherwise fall through to the host's native handler, compile, and
// never fire for a toggle. The selected state comes with change. On a
// component that never had the event, onToggle stays the host's native one.
export const solidToggle: SolidProps<typeof SolidIconButton> = {
  // @ts-expect-error -- onToggle is gone from the icon button: use onChange
  onToggle: () => {},
  onChange: (event) => {
    const selected: boolean = event.detail.selected;
    return selected;
  },
};
export const solidPlain: SolidProps<typeof SolidButton> = {
  onToggle: (event) => {
    const state: string = event.newState;
    return state;
  },
};
export const solidSelect: SolidProps<typeof SolidMenu> = {
  onSelect: (event) => {
    const value: string = event.detail.value;
    return value;
  },
};
export const solidClick: SolidSwitchProps = {
  onClick: (event) => {
    const x: number = event.clientX;
    return x;
  },
};

type SvelteSwitch = SvelteProps<SwitchSpec>;
export const svelteChange: SvelteSwitch = {
  onchange: (event) => {
    assert<Equals<typeof event, CustomEvent<SwitchDetail>>>();
    const checked: boolean = event.detail.checked;
    return checked;
  },
};
export const svelteChangeAnnotated: SvelteSwitch = {
  onchange: (event: CustomEvent<{ value: boolean }>) => {
    const value: boolean = event.detail.value;
    return value;
  },
};
export const svelteChangeEvent: SvelteSwitch = {
  onchange: (event: Event) => {
    void event.type;
  },
};
export const svelteChangeBare: SvelteSwitch = {
  // @ts-expect-error -- Event has no detail; the payload is the component's CustomEvent
  onchange: (event: Event) => event.detail,
};
export const svelteInput: SvelteProps<TextFieldSpec> = {
  oninput: (event) => {
    const value: string = event.detail.value;
    return value;
  },
};
// 1.0 removed the icon button's own `toggle` event, and its ontoggle is refused:
// it would otherwise fall through to the host's native handler, compile, and
// never fire for a toggle. The selected state comes with change. On a
// component that never had the event, ontoggle stays the host's native one.
export const svelteToggle: SvelteProps<IconButtonSpec> = {
  // @ts-expect-error -- ontoggle is gone from the icon button: use onchange
  ontoggle: () => {},
  onchange: (event) => {
    const selected: boolean = event.detail.selected;
    return selected;
  },
};
export const sveltePlain: SvelteProps<ButtonSpec> = {
  ontoggle: (event) => {
    const state: string = event.newState;
    return state;
  },
};
export const svelteSelect: SvelteProps<MenuSpec> = {
  onselect: (event) => {
    const value: string = event.detail.value;
    return value;
  },
};
export const svelteClick: SvelteSwitch = {
  onclick: (event) => {
    const x: number = event.clientX;
    return x;
  },
};

type VueSwitchProps = InstanceType<typeof MSwitch>["$props"];
export const vueChange: VueSwitchProps = {
  onChange: (event) => {
    assert<Equals<typeof event, CustomEvent<SwitchDetail>>>();
    const checked: boolean = event.detail.checked;
    return checked;
  },
};
export const vueChangeAnnotated: VueSwitchProps = {
  onChange: (event: CustomEvent<{ value: boolean }>) => {
    const value: boolean = event.detail.value;
    return value;
  },
};
export const vueChangeEvent: VueSwitchProps = {
  onChange: (event: Event) => {
    void event.type;
  },
};
export const vueChangeBare: VueSwitchProps = {
  // @ts-expect-error -- Event has no detail; the payload is the component's CustomEvent
  onChange: (event: Event) => event.detail,
};
export const vueInput: InstanceType<typeof MTextField>["$props"] = {
  onInput: (event) => {
    const value: string = event.detail.value;
    return value;
  },
};
// 1.0 removed the icon button's own `toggle` event, and its onToggle is refused:
// it would otherwise fall through to the host's native handler, compile, and
// never fire for a toggle. The selected state comes with change. On a
// component that never had the event, onToggle stays the host's native one.
export const vueToggle: InstanceType<typeof MIconButton>["$props"] = {
  // @ts-expect-error -- onToggle is gone from the icon button: use onChange
  onToggle: () => {},
  onChange: (event) => {
    const selected: boolean = event.detail.selected;
    return selected;
  },
};
export const vuePlain: InstanceType<typeof MButton>["$props"] = {
  onToggle: (event) => {
    const state: string = event.newState;
    return state;
  },
};
export const vueSelect: InstanceType<typeof MMenu>["$props"] = {
  onSelect: (event) => {
    const value: string = event.detail.value;
    return value;
  },
};
export const vueClick: VueSwitchProps = {
  onClick: (event) => {
    const x: number = event.clientX;
    return x;
  },
};
export const vueModel: VueSwitchProps = {
  "onUpdate:modelValue": (value) => {
    const checked: boolean = value;
    return checked;
  },
};

// The same calls `scripts/fixtures/vue-app.ts` makes. `h()` is what CI type-checks.
export const vueHChange = h(MSwitch, {
  onChange: (event) => {
    assert<Equals<typeof event, CustomEvent<SwitchDetail>>>();
    const checked: boolean = event.detail.checked;
    return checked;
  },
});
export const vueHAnnotated = h(MSwitch, {
  onChange: (event: CustomEvent<{ value: boolean }>) => {
    const value: boolean = event.detail.value;
    return value;
  },
});
export const vueHInput = h(MTextField, {
  onInput: (event: CustomEvent<{ value: string }>) => {
    const value: string = event.detail.value;
    return value;
  },
});
export const vueHChips = h(MChips, {
  onChange: (event: CustomEvent<{ value: string | string[] | null }>) => {
    const value: string | string[] | null = event.detail.value;
    return value;
  },
});
