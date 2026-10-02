// src/components/search/types.ts

/**
 * Search component state
 * - 'bar': Collapsed search bar (default)
 * - 'view': Expanded search view with suggestions
 */
export type SearchState = "bar" | "view";

/**
 * Search view display mode
 * - 'docked': Inline expanded view (360-720dp width, max 2/3 screen height)
 * - 'fullscreen': Full-screen overlay (mobile-first)
 */
export type SearchViewMode = "docked" | "fullscreen";

/**
 * Search variant, M3's style (FLO-287)
 * - 'contained': M3 Expressive. The bar keeps its pill and filled container
 *   when focused, and the results sit in their own container
 * - 'divided': the baseline. The bar squares off and a divider separates the
 *   results
 */
export type SearchVariant = "contained" | "divided";

/**
 * Valid event types for search component per MD3 spec: the names in {@link SearchEvents}
 */
export type SearchEventType = keyof SearchEvents;

/**
 * Trailing content item configuration
 */
export interface SearchTrailingItem {
  /** Unique identifier for the item */
  id: string;
  /**
   * HTML content (icon SVG or avatar image).
   * Markup (HTML). Not sanitized by default: see Markup and sanitizing.
   * An avatar is not a person's name or an image URL.
   */
  content: string;
  /** Type of trailing content */
  type: "icon" | "avatar";
  /** Accessible label for the item */
  ariaLabel?: string;
  /** Click handler */
  onClick?: (event: MouseEvent) => void;
}

/**
 * Search suggestion item
 */
export interface SearchSuggestion {
  /** Display text */
  text: string;
  /** Value to use when selected (defaults to text) */
  value?: string;
  /** Optional leading icon HTML. Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
  icon?: string;
  /** A second line under the text: a two-line list item (FLO-291) */
  supportingText?: string;
  /** Optional group identifier for dividers */
  group?: string;
}

/**
 * Search event data
 */
export interface SearchEvent {
  /** The search component instance */
  component: SearchComponent;
  /** Current search value */
  value: string;
  /** Original DOM event if available */
  originalEvent: Event | null;
  /** Selected suggestion (for suggestionSelect event) */
  suggestion?: SearchSuggestion;
  /** Prevents default behavior */
  preventDefault: () => void;
  /** Whether default was prevented */
  defaultPrevented: boolean;
}

/**
 * What `expand` and `collapse` carry: the search after the change. Not a
 * {@link SearchEvent}: there is no value, no DOM event and nothing to prevent.
 */
export interface SearchStateEvent {
  /** The search component instance */
  component: SearchComponent;
  /** The state after the change: `view` on expand, `bar` on collapse */
  state: SearchState;
  /** The view mode the search has */
  viewMode: SearchViewMode;
}

/**
 * The search's events and what each hands its listener. A config `on*` option
 * is the same listener, registered at creation.
 */
export interface SearchEvents {
  focus: (event: SearchEvent) => void;
  blur: (event: SearchEvent) => void;
  input: (event: SearchEvent) => void;
  submit: (event: SearchEvent) => void;
  clear: (event: SearchEvent) => void;
  suggestionSelect: (event: SearchEvent) => void;
  expand: (event: SearchStateEvent) => void;
  collapse: (event: SearchStateEvent) => void;
}

/**
 * Configuration options for the Search component
 * Aligned with Material Design 3 specifications
 */
export interface SearchConfig {
  // === State ===

  /** Initial state: 'bar' (collapsed) or 'view' (expanded). Default: 'bar' */
  initialState?: SearchState;

  /** View mode when expanded: 'docked' or 'fullscreen'. Default: 'docked' */
  viewMode?: SearchViewMode;

  /** 'contained' (M3 Expressive) or 'divided' (baseline). Default: 'contained' */
  variant?: SearchVariant;

  /** Whether the search component is disabled */
  disabled?: boolean;

  // === Content ===

  /** Placeholder/supporting text. Default: 'Search' */
  placeholder?: string;

  /** Initial input value */
  value?: string;

  /**
   * Form field name. Set on the text input itself, so the search takes part
   * in a surrounding form and its value appears in `FormData`. Without it the
   * search submits nothing.
   */
  name?: string;

  /** Custom leading icon HTML (replaces default search icon). Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
  leadingIcon?: string;

  /** Trailing content items (icons, avatar) */
  trailingItems?: SearchTrailingItem[];

  /** Suggestions to display in view mode */
  suggestions?: SearchSuggestion[] | string[];

  // === Behavior ===

  /** Show clear button when input has value. Default: true */
  showClearButton?: boolean;

  /** Auto-expand to view on focus. Default: true */
  expandOnFocus?: boolean;

  /** Auto-collapse on blur (with delay). Default: true */
  collapseOnBlur?: boolean;

  /** Collapse delay in ms when collapseOnBlur is true. Default: 150 */
  collapseDelay?: number;

  // === Sizing ===

  /** Minimum width in pixels. Default: 360 */
  minWidth?: number;

  /** Maximum width in pixels. Default: 720 */
  maxWidth?: number;

  /** Full width mode (ignores min/max width) */
  fullWidth?: boolean;

  // === Styling ===

  /** Additional CSS classes */
  class?: string;

  /** Component prefix for class names */
  prefix?: string;

  // === Event Handlers ===

  /** `submit` listener registered at creation. */
  onSubmit?: SearchEvents["submit"];

  /** `input` listener registered at creation. */
  onInput?: SearchEvents["input"];

  /** `clear` listener registered at creation. */
  onClear?: SearchEvents["clear"];

  /** `expand` listener registered at creation. */
  onExpand?: SearchEvents["expand"];

  /** `collapse` listener registered at creation. */
  onCollapse?: SearchEvents["collapse"];

  /** `suggestionSelect` listener registered at creation. */
  onSuggestionSelect?: SearchEvents["suggestionSelect"];

  /** Event handlers map */
  on?: Partial<SearchEvents>;
}

/**
 * Search component public API interface
 * Aligned with Material Design 3 specifications
 */
export interface SearchComponent {
  /** The root element of the search component */
  element: HTMLElement;

  // === Value Management ===

  /** Sets the search input value. Silent unless `triggerEvent` is true (FLO-328). */
  setValue: (value: string, triggerEvent?: boolean) => SearchComponent;

  /** Gets the current search input value */
  getValue: () => string;

  /** Sets the placeholder/supporting text */
  setPlaceholder: (text: string) => SearchComponent;

  /** Gets the current placeholder text */
  getPlaceholder: () => string;

  // === State Management ===

  /** Expands to search view */
  expand: () => SearchComponent;

  /** Collapses to search bar */
  collapse: () => SearchComponent;

  /** Gets the current state ('bar' or 'view') */
  getState: () => SearchState;

  /** Checks if currently expanded */
  isExpanded: () => boolean;

  /** Sets the view mode ('docked' or 'fullscreen') */
  setViewMode: (mode: SearchViewMode) => SearchComponent;

  /** Gets the current view mode */
  getViewMode: () => SearchViewMode;

  /** Sets the variant ('contained' or 'divided') */
  setVariant: (variant: SearchVariant) => SearchComponent;

  /** Gets the current variant */
  getVariant: () => SearchVariant;

  // === Input Controls ===

  /** Focuses the search input */
  focus: () => SearchComponent;

  /** Blurs the search input */
  blur: () => SearchComponent;

  /** Clears the search input. Silent: only the clear button emits `input` and `clear`. */
  clear: () => SearchComponent;

  /** Submits the current search value */
  submit: () => SearchComponent;

  // === Content Management ===

  /** Sets the leading icon HTML */
  setLeadingIcon: (iconHtml: string) => SearchComponent;

  /** Adds a trailing item */
  addTrailingItem: (item: SearchTrailingItem) => SearchComponent;

  /** Removes a trailing item by id */
  removeTrailingItem: (id: string) => SearchComponent;

  /** Sets all trailing items */
  setTrailingItems: (items: SearchTrailingItem[]) => SearchComponent;

  // === Suggestions ===

  /** Sets the suggestions list */
  setSuggestions: (
    suggestions: SearchSuggestion[] | string[],
  ) => SearchComponent;

  /** Gets the current suggestions */
  getSuggestions: () => SearchSuggestion[];

  /** Clears all suggestions */
  clearSuggestions: () => SearchComponent;

  // === Disabled State ===

  /** Enables the search component */
  enable: () => SearchComponent;

  /** Disables the search component */
  disable: () => SearchComponent;

  /** Checks if the component is disabled */
  isDisabled: () => boolean;

  // === Events ===

  /** Adds an event listener */
  on: <K extends keyof SearchEvents>(event: K, handler: SearchEvents[K]) => SearchComponent;

  /** Removes an event listener */
  off: <K extends keyof SearchEvents>(event: K, handler: SearchEvents[K]) => SearchComponent;

  // === Lifecycle ===

  /** Destroys the component and cleans up resources */
  destroy: () => void;
}

/**
 * Internal component structure references
 * @internal
 */
export interface SearchStructure {
  /**
   * The bar and, when expanded, its results: what shows in the top layer while
   * the view is open (FLO-285)
   */
  surface: HTMLElement;
  /** Main container element */
  container: HTMLElement;
  /** Input element */
  input: HTMLInputElement;
  /** Input wrapper element */
  inputWrapper: HTMLElement;
  /** Leading icon container */
  leadingIcon: HTMLElement;
  /** Clear button element */
  clearButton: HTMLElement | null;
  /** Trailing items container */
  trailingContainer: HTMLElement | null;
  /** Header divider (view mode) */
  divider: HTMLElement | null;
  /** Suggestions container (view mode) */
  suggestionsContainer: HTMLElement | null;
  /** Suggestions list element */
  suggestionsList: HTMLElement | null;
  /** The live region that announces the suggestion count (FLO-286) */
  status: HTMLElement;
}

/**
 * Internal search state
 * @internal
 */
export interface SearchInternalState {
  /** Current component state */
  state: SearchState;
  /** Current view mode */
  viewMode: SearchViewMode;
  /** Current input value */
  value: string;
  /** Current placeholder */
  placeholder: string;
  /** Whether input is focused */
  isFocused: boolean;
  /** Whether component is disabled */
  isDisabled: boolean;
  /** Current suggestions */
  suggestions: SearchSuggestion[];
  /** Currently highlighted suggestion index (-1 = none) */
  highlightedIndex: number;
  /** Trailing items */
  trailingItems: SearchTrailingItem[];
}
