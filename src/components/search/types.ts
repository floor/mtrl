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
 * Valid event types for search component per MD3 spec
 */
export type SearchEventType =
  | "focus"
  | "blur"
  | "input"
  | "submit"
  | "clear"
  | "expand"
  | "collapse"
  | "suggestionSelect";

/**
 * Trailing content item configuration
 */
export interface SearchTrailingItem {
  /** Unique identifier for the item */
  id: string;
  /** HTML content (icon SVG or avatar image) */
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
  /** Optional leading icon HTML */
  icon?: string;
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
 * Configuration options for the Search component
 * Aligned with Material Design 3 specifications
 */
export interface SearchConfig {
  // === State ===

  /** Initial state: 'bar' (collapsed) or 'view' (expanded). Default: 'bar' */
  initialState?: SearchState;

  /** View mode when expanded: 'docked' or 'fullscreen'. Default: 'docked' */
  viewMode?: SearchViewMode;

  /** Whether the search component is disabled */
  disabled?: boolean;

  // === Content ===

  /** Placeholder/supporting text. Default: 'Search' */
  placeholder?: string;

  /** Initial input value */
  value?: string;

  /** Custom leading icon HTML (replaces default search icon) */
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

  /** Called when search is submitted */
  onSubmit?: (value: string) => void;

  /** Called when input value changes */
  onInput?: (value: string) => void;

  /** Called when search is cleared */
  onClear?: () => void;

  /** Called when view expands */
  onExpand?: () => void;

  /** Called when view collapses */
  onCollapse?: () => void;

  /** Called when a suggestion is selected */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;

  /** Event handlers map */
  on?: Partial<Record<SearchEventType, (event: SearchEvent) => void>>;
}

/**
 * Search component public API interface
 * Aligned with Material Design 3 specifications
 */
export interface SearchComponent {
  /** The root element of the search component */
  element: HTMLElement;

  // === Value Management ===

  /** Sets the search input value */
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

  // === Input Controls ===

  /** Focuses the search input */
  focus: () => SearchComponent;

  /** Blurs the search input */
  blur: () => SearchComponent;

  /** Clears the search input */
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
  on: (
    event: SearchEventType,
    handler: (event: SearchEvent) => void,
  ) => SearchComponent;

  /** Removes an event listener */
  off: (
    event: SearchEventType,
    handler: (event: SearchEvent) => void,
  ) => SearchComponent;

  // === Lifecycle ===

  /** Destroys the component and cleans up resources */
  destroy: () => void;
}

/**
 * Internal component structure references
 * @internal
 */
export interface SearchStructure {
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
