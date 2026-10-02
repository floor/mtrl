// test/types/menu-member.fixture.ts
//
// FLO-543: the inner menu is not on SelectComponent or SplitButtonComponent.
import type { SelectComponent } from "../../src/components/select/types";
import type { SplitButtonComponent } from "../../src/components/split-button/types";
import type { MenuContent } from "../../src/components/menu/types";

declare const select: SelectComponent;
declare const split: SplitButtonComponent;

// @ts-expect-error the select's menu is not a member
void select.menu;
// @ts-expect-error the split button's menu is not a member
void split.menu;

// What was reached through it is on the component
const items: MenuContent[] = split.getItems();
const same: SplitButtonComponent = split.setItems(items);
void same;
