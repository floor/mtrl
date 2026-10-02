/** Public selective CSS entries. Keep dependency order consistent with main.scss. */
export const componentStyles: Record<string, { source: string; dependencies: string[] }> = {
  textfield: { source: "components/textfield", dependencies: [] },
  badge: { source: "components/badge", dependencies: [] },
  "bottom-app-bar": { source: "components/bottom-app-bar", dependencies: [] },
  "bottom-sheet": { source: "components/bottom-sheet", dependencies: [] },
  "side-sheet": { source: "components/side-sheet", dependencies: [] },
  menu: { source: "components/menu", dependencies: [] },
  slider: { source: "components/slider", dependencies: [] },
  switch: { source: "components/switch", dependencies: [] },
  select: { source: "components/select", dependencies: ["textfield", "menu"] },
  tabs: { source: "components/tabs", dependencies: ["badge", "button"] },
  "top-app-bar": { source: "components/top-app-bar", dependencies: [] },
  button: { source: "components/button", dependencies: ["progress"] },
  "button-group": { source: "components/button-group", dependencies: ["button", "icon-button"] },
  fab: { source: "components/fab", dependencies: [] },
  "fab-menu": { source: "components/fab-menu", dependencies: ["fab", "menu"] },
  "extended-fab": { source: "components/extended-fab", dependencies: [] },
  "icon-button": { source: "components/icon-button", dependencies: [] },
  card: { source: "components/card", dependencies: ["button"] },
  carousel: { source: "components/carousel", dependencies: [] },
  checkbox: { source: "components/checkbox", dependencies: [] },
  chips: { source: "components/chips", dependencies: [] },
  dialog: { source: "components/dialog", dependencies: ["button", "divider"] },
  divider: { source: "components/divider", dependencies: [] },
  drawer: { source: "components/drawer", dependencies: [] },
  progress: { source: "components/progress", dependencies: [] },
  "loading-indicator": { source: "components/loading-indicator", dependencies: [] },
  "split-button": { source: "components/split-button", dependencies: ["menu", "button"] },
  radios: { source: "components/radios", dependencies: [] },
  datepicker: { source: "components/datepicker", dependencies: [] },
  timepicker: { source: "components/timepicker", dependencies: [] },
  search: { source: "components/search", dependencies: [] },
  snackbar: { source: "components/snackbar", dependencies: ["button", "icon-button"] },
  "navigation-bar": { source: "components/navigation-bar", dependencies: [] },
  "navigation-rail": { source: "components/navigation-rail", dependencies: [] },
  list: { source: "components/list", dependencies: [] },
  tooltip: { source: "components/tooltip", dependencies: [] },
  toolbar: { source: "components/toolbar", dependencies: ["button", "icon-button"] },
};

// All shipped components have selective CSS entries.
export const fullOnlyStyles: string[] = [];

// Themes in the full stylesheet, each also shipped as `mtrl/themes/<name>`.
// 1.0.0 removed material, winter, browngreen and legacy (FLO-308, FLO-428).
export const themeStyles = [
  "baseline", "ocean", "desert", "forest", "sunset", "spring", "summer",
  "autumn", "brownbeige", "sageivory", "tealcaramel", "highcontrast",
];

// Themes shipped only as `mtrl/themes/<name>`, outside the full stylesheet, so
// an app pays for one only by importing it: the M3 scheme variants generated
// by scripts/generate-themes.ts (FLO-308). Every theme file is in exactly one
// of the two lists (test/core/theme).
export const standaloneThemes = [
  "neutral", "vibrant", "expressive", "fidelity", "content", "monochrome",
  "rainbow", "fruit-salad",
];

export const baseStyles = [
  "themes/baseline", "base/foundation", "base/reset",
  "utilities/ripple", "base/document",
];
// The type classes, text utilities, heading styles and typescale tokens that
// left the base (FLO-539). Emitted in the base cascade layer: see build-styles.
export const typographyStyles = [
  "base/typescale", "base/typography",
];
// What `mtrl/styles/typography`'s module imports first, as a component's
// imports its dependencies. The sheet has to come after the base: both are in
// mtrl.base, and its `margin-bottom` on h1 to h6 and p has the specificity of
// the reset's `margin: 0`, so the later one wins.
export const typographyDependencies = ["base"];
export const utilityStyles = [
  "utilities/spacing", "utilities/visibility", "utilities/colors",
  "utilities/flexbox", "utilities/typography", "utilities/layout",
];

/** Resolve dependencies once in order; reject missing entries and cycles. */
export function resolveStyleDependencies(
  names: string[],
  manifest = componentStyles,
): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const active = new Set<string>();
  function visit(name: string) {
    if (active.has(name)) throw new Error(`CSS dependency cycle at ${name}`);
    if (visited.has(name)) return;
    if (!Object.hasOwn(manifest, name)) throw new Error(`Unknown CSS dependency: ${name}`);
    active.add(name);
    for (const dependency of manifest[name].dependencies) visit(dependency);
    active.delete(name);
    visited.add(name);
    result.push(name);
  }
  for (const name of names) visit(name);
  return result;
}
