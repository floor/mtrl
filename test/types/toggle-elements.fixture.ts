// test/types/toggle-elements.fixture.ts
//
// FLO-380 PR 3: the element and adapter surface of the toggle buttons' and the
// carousel's change. Each element's detail carries value beside the old field,
// and every adapter types its change handler with it. The factory payloads are
// pinned in button-events, icon-button-events and carousel-events.
import type * as React from "react";
import type { ElementEvents, ButtonSpec, IconButtonSpec, CarouselSpec } from "../../src/elements";
import type { Button, IconButton, Carousel } from "../../src/react";
import type { Button as SolidButton, IconButton as SolidIconButton, Carousel as SolidCarousel } from "../../src/solid";
import type { ComponentProps as ReactProps } from "react";
import type { ComponentProps as SolidProps, JSX } from "solid-js";
import type { SvelteProps } from "../../src/svelte/runtime";
import type { VueEmits } from "../../src/vue";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Toggle = CustomEvent<{ selected: boolean; value: string }>;
type Slide = CustomEvent<{ value: number }>;

// The elements' details
export const button: Equals<ElementEvents<ButtonSpec>["change"], Toggle> = true;
export const iconButton: Equals<ElementEvents<IconButtonSpec>["change"], Toggle> = true;
// 1.0 removed the icon button's DOM toggle: change is its only model event
export const iconButtonEvents: Equals<keyof ElementEvents<IconButtonSpec>, "change"> = true;
export const carousel: Equals<ElementEvents<CarouselSpec>["change"], Slide> = true;

// React and Solid: onChange
export const reactButton: Equals<ReactProps<typeof Button>["onChange"], ((event: Toggle) => void) | undefined> = true;
export const reactIconButton: Equals<ReactProps<typeof IconButton>["onChange"], ((event: Toggle) => void) | undefined> = true;
export const reactCarousel: Equals<ReactProps<typeof Carousel>["onChange"], ((event: Slide) => void) | undefined> = true;
export const solidButton: Equals<SolidProps<typeof SolidButton>["onChange"], ((event: Toggle) => void) | undefined> = true;
export const solidIconButton: Equals<SolidProps<typeof SolidIconButton>["onChange"], ((event: Toggle) => void) | undefined> = true;
export const solidCarousel: Equals<SolidProps<typeof SolidCarousel>["onChange"], ((event: Slide) => void) | undefined> = true;

// Svelte: onchange; Vue: the emitted event
export const svelteButton: Equals<SvelteProps<ButtonSpec>["onchange"], ((event: Toggle) => void) | undefined> = true;
export const svelteCarousel: Equals<SvelteProps<CarouselSpec>["onchange"], ((event: Slide) => void) | undefined> = true;
export const vueButton: Equals<Parameters<VueEmits<ButtonSpec>["change"]>[0], Toggle> = true;
export const vueCarousel: Equals<Parameters<VueEmits<CarouselSpec>["change"]>[0], Slide> = true;

// The CHANGELOG's migration as a test: Button owns onChange, so a full set of
// HTML attributes, which carries the framework's own onChange, no longer spreads in.
declare const reactAttrs: React.HTMLAttributes<HTMLElement>;
declare const solidAttrs: JSX.HTMLAttributes<HTMLElement>;
// @ts-expect-error a full React.HTMLAttributes carries React's own onChange
export const reactClash: ReactProps<typeof Button> = { ...reactAttrs };
export const reactSpread: ReactProps<typeof Button> = { ...(reactAttrs as Omit<React.HTMLAttributes<HTMLElement>, "onChange">) };
// @ts-expect-error a full Solid JSX.HTMLAttributes carries Solid's own onChange
export const solidClash: SolidProps<typeof SolidButton> = { ...solidAttrs };
