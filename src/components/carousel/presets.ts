// src/components/carousel/presets.ts
// Ported from vlist carousel presets.
// Registry-based preset system — each preset maps a variant name
// to a slot configuration for the layout engine.

export type TextFade = "role" | "viewport" | "size";

export interface SlotConfig {
  slots: number[];
  focalSlot: number;
  textFade?: TextFade;
}

export interface NoEngineConfig {
  textFade?: TextFade;
}

export type PresetResult = SlotConfig | NoEngineConfig | null;
export type SlotConfigResolver = (containerSize: number, peek: number) => PresetResult;

const presetRegistry = new Map<string, SlotConfigResolver>();

export function registerPreset(name: string, resolver: SlotConfigResolver): void {
  presetRegistry.set(name, resolver);
}

export function resolvePreset(
  variant: string,
  containerSize: number,
  peek: number,
): PresetResult {
  const resolver = presetRegistry.get(variant);
  return resolver ? resolver(containerSize, peek) : null;
}

export function hasSlots(result: PresetResult): result is SlotConfig {
  return result !== null && typeof result === "object" && "slots" in result;
}

// Built-in presets

registerPreset("full", () => ({
  slots: [1.0],
  focalSlot: 0,
}));

registerPreset("hero", (containerSize, peek) => ({
  slots: [(containerSize - peek) / containerSize, peek / containerSize],
  focalSlot: 0,
}));

registerPreset("hero-center", (containerSize, peek) => ({
  slots: [
    peek / containerSize,
    (containerSize - 2 * peek) / containerSize,
    peek / containerSize,
  ],
  focalSlot: 1,
}));

registerPreset("multi", () => {
  const large = 0.4;
  const medium = 0.3;
  const small = 0.2;
  const tiny = 1 - large - medium - small;
  return { slots: [large, medium, small, tiny], focalSlot: 0 };
});

registerPreset("uncontained", (containerSize) => {
  const count = Math.max(2, Math.floor(containerSize / (containerSize * 0.33)));
  const ratio = 1 / count;
  return {
    slots: Array.from({ length: count }, () => ratio),
    focalSlot: 0,
    textFade: "size" as TextFade,
  };
});
