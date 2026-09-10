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
  "extended-fab": { source: "components/extended-fab", dependencies: [] },
  "icon-button": { source: "components/icon-button", dependencies: [] },
  "segmented-button": { source: "components/segmented-button", dependencies: ["button"] },
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
  timepicker: { source: "components/timepicker", dependencies: [] },
  search: { source: "components/search", dependencies: [] },
  snackbar: { source: "components/snackbar", dependencies: ["button", "icon-button"] },
  navigation: { source: "components/navigation", dependencies: [] },
  list: { source: "components/list", dependencies: [] },
};

// Full-bundle-only until the component is finished. Its files are not modified.
export const fullOnlyStyles = ["components/datepicker"];

export const themeStyles = [
  "baseline", "ocean", "desert", "forest", "sunset", "spring", "summer",
  "autumn", "winter", "brownbeige", "browngreen", "sageivory", "tealcaramel",
  "legacy", "material", "highcontrast",
];

export const baseStyles = [
  "themes/baseline", "base/tokens", "base/reset", "base/typography",
  "utilities/ripple", "base/document",
];
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
