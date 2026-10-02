// test/types/open-close-payload.fixture.ts
//
// FLO-548: a menu's and a select's `open` and `close` cannot be cancelled, so
// their payloads no longer carry `preventDefault` / `defaultPrevented` (they
// did nothing), in the types and at run time. Nor does a select's `change`.
// A menu's `select` keeps both: preventing it keeps the menu open.
import type { MenuComponent } from "../../src/components/menu/types";
import type { SelectComponent } from "../../src/components/select/types";

declare const menu: MenuComponent;
declare const select: SelectComponent;

menu.on("open", (event) => {
  // @ts-expect-error open cannot be cancelled
  event.preventDefault();
  // @ts-expect-error nor does it say whether it was
  void event.defaultPrevented;
  void event.menu;
  void event.originalEvent;
});
menu.on("close", (event) => {
  // @ts-expect-error close cannot be cancelled
  event.preventDefault();
});
menu.on("select", (event) => {
  event.preventDefault();
  const prevented: boolean = event.defaultPrevented;
  void prevented;
});

select.on("open", (event) => {
  // @ts-expect-error open cannot be cancelled
  event.preventDefault();
  void event.select;
});
select.on("close", (event) => {
  // @ts-expect-error close cannot be cancelled
  void event.defaultPrevented;
});
select.on("change", (event) => {
  // @ts-expect-error a change cannot be cancelled: the value has changed
  event.preventDefault();
  void event.value;
});
