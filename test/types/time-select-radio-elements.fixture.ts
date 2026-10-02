// test/types/time-select-radio-elements.fixture.ts
// FLO-380 PR 5: custom-element events and generated adapter props.
import type { ElementEvents, TimepickerSpec, SelectSpec, RadiosSpec } from "../../src/elements";
import type { Timepicker as ReactTimepicker, Select as ReactSelect, Radios as ReactRadios } from "../../src/react";
import type { Timepicker as SolidTimepicker, Select as SolidSelect, Radios as SolidRadios } from "../../src/solid";
import type { ComponentProps as ReactProps } from "react";
import type { ComponentProps as SolidProps } from "solid-js";
import type { SvelteProps } from "../../src/svelte/runtime";
import type { VueEmits } from "../../src/vue";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Input = CustomEvent<{ value: string; draftValue: string }>;
type Value = CustomEvent<{ value: string }>;
type Nullable = CustomEvent<{ value: string | null }>;

export const timeInput: Equals<ElementEvents<TimepickerSpec>["input"], Input> = true;
export const timeConfirm: Equals<ElementEvents<TimepickerSpec>["confirm"], Value> = true;
export const selectChange: Equals<ElementEvents<SelectSpec>["change"], Nullable> = true;
export const radiosChange: Equals<ElementEvents<RadiosSpec>["change"], Nullable> = true;
export const reactConfirm: Equals<ReactProps<typeof ReactTimepicker>["onConfirm"], ((event: Value) => void) | undefined> = true;
export const solidConfirm: Equals<SolidProps<typeof SolidTimepicker>["onConfirm"], ((event: Value) => void) | undefined> = true;
export const svelteConfirm: Equals<SvelteProps<TimepickerSpec>["onconfirm"], ((event: Value) => void) | undefined> = true;
export const vueConfirm: Equals<Parameters<VueEmits<TimepickerSpec>["confirm"]>[0], Value> = true;
export const reactInput: Equals<ReactProps<typeof ReactTimepicker>["onInput"], ((event: Input) => void) | undefined> = true;
export const solidInput: Equals<SolidProps<typeof SolidTimepicker>["onInput"], ((event: Input) => void) | undefined> = true;
export const reactSelect: Equals<ReactProps<typeof ReactSelect>["onChange"], ((event: Nullable) => void) | undefined> = true;
export const solidSelect: Equals<SolidProps<typeof SolidSelect>["onChange"], ((event: Nullable) => void) | undefined> = true;
export const reactRadios: Equals<ReactProps<typeof ReactRadios>["onChange"], ((event: Nullable) => void) | undefined> = true;
export const solidRadios: Equals<SolidProps<typeof SolidRadios>["onChange"], ((event: Nullable) => void) | undefined> = true;
export const svelteSelect: Equals<SvelteProps<SelectSpec>["onchange"], ((event: Nullable) => void) | undefined> = true;
export const vueRadios: Equals<Parameters<VueEmits<RadiosSpec>["change"]>[0], Nullable> = true;

// A null value clears the radios: on the element, and in every adapter's value prop
// (Vue's v-model and Svelte's bind:value drive the same property).
import type { RadiosElement } from "../../src/elements";
import type { VueProps } from "../../src/vue";
export const elementValue: Equals<RadiosElement["value"], string | null | undefined> = true;
export const reactRadiosNull: ReactProps<typeof ReactRadios> = { value: null };
export const solidRadiosNull: SolidProps<typeof SolidRadios> = { value: null };
export const svelteRadiosNull: SvelteProps<RadiosSpec> = { value: null };
export const vueRadiosNull: VueProps<RadiosSpec> = { value: null, modelValue: null };
// @ts-expect-error a number is not a radio value
export const reactRadiosNumber: ReactProps<typeof ReactRadios> = { value: 3 };
