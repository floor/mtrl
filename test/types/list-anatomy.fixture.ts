import { createList, type ListItem, type ListSlot } from "../../src";
const leading: ListSlot = { type: "avatar", content: document.createElement("img") };
const items: ListItem[] = [
  { kind: "subheader", headline: "People" },
  { id: 0, headline: "Ada", overline: "Team", supportingText: "Available", lines: 3, leading, trailing: { type: "text", content: "Now" } },
  { kind: "divider", inset: true },
];
createList({ items }).on("select", event => event.component.getAllItems());
// @ts-expect-error list anatomy supports one, two or three text lines
createList({ items: [{ headline: "Too many", lines: 4 }] });
// @ts-expect-error slots name a supported anatomy type
createList({ items: [{ leading: { type: "picture", content: "image" } }] });
// @ts-expect-error supporting text is text, not an HTML node
createList({ items: [{ supportingText: document.createElement("div") }] });
