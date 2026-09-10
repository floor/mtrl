// Loaded only by the packed Vite fixture, never by Bun's unit test runner.
import {
  createButton, createTextfield, createSelect, createCheckbox, createSegmentedButton,
  createButtonGroup, createSplitButton, createTabs, createCard, createDialog, createSnackbar,
} from "mtrl";

const root = document.querySelector("main")!;
const add = <T extends { element: HTMLElement }>(component: T): T => { root.append(component.element); return component; };
const row = () => { const el = document.createElement("section"); root.append(el); return el; };
const icon = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M11 3h2v8h8v2h-8v8h-2v-8H3v-2h8z"/></svg>';
const params = new URLSearchParams(location.search);
const theme = params.get("theme") ?? "baseline";
const mode = params.get("mode") ?? "light";
document.documentElement.dataset.theme = theme;
document.documentElement.dataset.themeMode = mode;
const cases: Record<string, () => unknown> = {
  button() {
    for (const variant of ["filled", "outlined", "tonal", "text", "elevated"]) {
      const section = row();
      section.append(createButton({ text: variant, variant, icon, ripple: false }).element);
      section.append(createButton({ text: "Disabled", variant, disabled: true }).element);
    }
    const loading = createButton({ text: "Upload", progress: { indeterminate: false, value: 40 } });
    add(loading);
    return loading.showProgress();
  },
  textfield() {
    add(createTextfield({ label: "Name", value: "Ada", variant: "outlined" }));
    add(createTextfield({ label: "Email", value: "invalid", variant: "filled", error: true, supportingText: "Enter an email address" }));
    add(createTextfield({ label: "Disabled", disabled: true, value: "Read only" }));
  },
  select() {
    const select = add(createSelect({ label: "Destination", variant: "outlined", options: [
      { id: "paris", text: "Paris" }, { id: "lyon", text: "Lyon" },
    ] }));
    if (params.get("state") === "open") select.open();
    if (params.get("state") === "error") select.setError(true, "Choose a destination");
    (window as any).control = select;
  },
  checkbox() {
    add(createCheckbox({ label: "Unchecked" }));
    add(createCheckbox({ label: "Checked", checked: true }));
    add(createCheckbox({ label: "Mixed", indeterminate: true }));
    add(createCheckbox({ label: "Disabled", disabled: true, checked: true }));
  },
  "segmented-button"() {
    add(createSegmentedButton({ segments: [
      { text: "Day", value: "day", selected: true }, { text: "Week", value: "week" },
      { text: "Month", value: "month", disabled: true },
    ] }));
  },
  "button-group"() {
    add(createButtonGroup({ kind: "connected", buttons: [{ text: "Cut" }, { text: "Copy" }, { text: "Paste", disabled: true }] }));
    add(createButtonGroup({ buttons: [{ icon, ariaLabel: "Add" }, { icon, ariaLabel: "More" }] }));
  },
  "split-button"() {
    const split = add(createSplitButton({ text: "Save", items: [{ id: "copy", text: "Save a copy" }, { id: "export", text: "Export" }] }));
    if (params.get("state") === "open") split.trailingElement.click();
  },
  tabs() {
    add(createTabs({ tabs: [{ text: "Overview", value: "overview", badge: "3" }, { text: "Details", value: "details" }] }));
  },
  card() {
    return add(createCard({ content: { text: "A card with a lazy action button." }, buttons: [{ text: "Continue" }] }));
  },
  dialog() {
    const dialog = createDialog({ title: "Save changes?", content: "Your changes will be saved to this project.", buttons: [
      { text: "Cancel", variant: "text" }, { text: "Save", variant: "filled" },
    ], animation: "none" });
    dialog.open();
  },
  snackbar() {
    const snackbar = createSnackbar({ message: "Changes saved", action: "Undo", duration: 0 });
    snackbar.show();
  },
};
try {
  await cases[document.body.dataset.case!]();
  await document.fonts.ready;
  await new Promise(resolve => setTimeout(resolve, 100));
  document.body.dataset.ready = "true";
} catch (error) {
  console.error(error);
  document.body.dataset.error = String(error);
}
