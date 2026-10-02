// test/types/search-state-events.fixture.ts
//
// The search's expand and collapse carry `{ component, state, viewMode }`, not
// the SearchEvent the other six events carry: no value, no preventDefault. The
// listener and the `onExpand` / `onCollapse` options are typed with what is
// emitted (features/states.ts), from the SearchEvents map.
import createSearch from "../../src/components/search";
import type { SearchComponent, SearchState, SearchViewMode } from "../../src/components/search/types";
import type { SearchElementComponent } from "../../src/elements/search";

declare const search: SearchComponent;

// What is there compiles: in a listener, and in the option
search.on("expand", (event) => { const state: SearchState = event.state; const mode: SearchViewMode = event.viewMode; void state; void mode; });
search.off("collapse", (event) => { const state: SearchState = event.state; void state; void event.component; });
createSearch({
  onExpand: (event) => { const state: SearchState = event.state; const mode: SearchViewMode = event.viewMode; void state; void mode; },
  onCollapse: (event) => { const state: SearchState = event.state; void state; },
  on: { expand: (event) => void event.viewMode, collapse: (event) => void event.state },
});

// What is not there is an error
// @ts-expect-error expand carries no preventDefault
search.on("expand", (event) => event.preventDefault());
// @ts-expect-error collapse carries no value
search.on("collapse", (event) => event.value);
// @ts-expect-error onExpand carries no preventDefault
createSearch({ onExpand: (event) => event.preventDefault() });
// @ts-expect-error onExpand carries no value
createSearch({ onExpand: (event) => event.value });
// @ts-expect-error onCollapse carries no originalEvent
createSearch({ onCollapse: (event) => event.originalEvent });

// The other six still carry the SearchEvent
search.on("submit", (event) => { const value: string = event.value; event.preventDefault(); void value; });
createSearch({ onInput: (event) => void event.value, onSuggestionSelect: (event) => void event.suggestion?.text });
// @ts-expect-error submit carries no state
search.on("submit", (event) => event.state);

// <m-search>'s component: `open` and `close` are expand and collapse under the element's names
declare const element: SearchElementComponent;
element.on("open", (event) => { const state: SearchState = event.state; void state; });
element.off("close", (event) => void event.viewMode);
element.on("expand", (event) => void event.state);
element.on("change", (event) => { const value: string = event.value; void value; });
// @ts-expect-error open carries no value
element.on("open", (event) => event.value);
// @ts-expect-error close carries no preventDefault
element.on("close", (event) => event.preventDefault());
