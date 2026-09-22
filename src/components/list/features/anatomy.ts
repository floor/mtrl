import { setHTML } from "../../../core/dom/html";
import type { ListItem, ListSlot } from "../types";

let nextLabel = 0;
export const itemLabel = (item: ListItem): string => String(item.headline ?? item.text ?? item.title ?? item.name ?? item.id ?? "");
export const isDataItem = (item: ListItem): boolean => !item.kind || item.kind === "item";
export const itemId = (item: ListItem, index: number): string => String(item.id ?? index);

/** Standard Compose ListItem anatomy; all interactive slots stay outside the action. */
export function renderAnatomy(item: ListItem, getClass: (name: string) => string): HTMLElement {
  const row = document.createElement("div");
  const lines = item.lines ?? (item.overline && item.supportingText ? 3 : item.overline || item.supportingText ? 2 : 1);
  row.dataset.lines = String(lines);
  row.classList.add(getClass(`list__item--${["one", "two", "three"][lines - 1]}-line`));
  const text = document.createElement("div"); text.className = getClass("list__text");
  const appendText = (name: string, value: string) => {
    const element = document.createElement("div"); element.className = getClass(`list__${name}`);
    element.textContent = value; text.append(element); return element;
  };
  const identifier = `${getClass("list")}-${++nextLabel}`;
  if (item.overline) appendText("overline", item.overline);
  const headline = appendText("headline", itemLabel(item)); headline.id = `${identifier}-headline`;
  if (item.supportingText) appendText("supporting", item.supportingText).id = `${identifier}-supporting`;
  const slot = (position: "leading" | "trailing", value: ListSlot) => {
    const el = document.createElement("div");
    el.className = `${getClass(`list__${position}`)} ${getClass(`list__${position}--${value.type}`)}`;
    if (value.type === "text") el.textContent = typeof value.content === "string" ? value.content : value.content.textContent;
    else if (typeof value.content === "string") setHTML(el, value.content);
    else el.append(value.content);
    if (value.type === "control" || value.type === "custom") el.dataset.listControl = "";
    else if (value.type === "icon") el.setAttribute("aria-hidden", "true");
    return el;
  };
  if (item.leading) row.append(slot("leading", item.leading));
  row.append(text);
  if (item.trailing) row.append(slot("trailing", item.trailing));
  return row;
}
