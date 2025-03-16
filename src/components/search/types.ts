// src/components/search/types.ts
import { SEARCH_VARIANTS, SEARCH_EVENTS } from './constants';

/**
 * Configuration options for the search component
 */
export interface SearchConfig {
  /** The variant of the search component (bar or view) */
  variant?: keyof typeof SEARCH_VARIANTS | typeof SEARCH_VARIANTS[keyof typeof SEARCH_VARIANTS];
  
  /** Whether the search component is disabled */
  disabled?: boolean;
  
  /** Placeholder text for the search input */
  placeholder?: string;
  
  /** Initial value for the search input */
  value?: string;
  
  /** Leading icon HTML or 'none' to remove */
  leadingIcon?: string;
  
  /** Trailing icon HTML (optional) */
  trailingIcon?: string;
  
  /** Second trailing icon HTML (optional) */
  trailingIcon2?: string;
  
  /** Avatar HTML for trailing avatar (optional) */
  avatar?: string;

  /** If true, will show the clear button when the input has text */
  showClearButton?: boolean;
  
  /** Callback function when a search is submitted */
  onSubmit?: (value: string) => void;
  
  /** Callback function when the input value changes */
  onInput?: (value: string) => void;
  
  /** Callback function when the clear button is clicked */
  onClear?: () => void;
  
  /** Suggestions to show when the search is focused (array of strings or objects) */
  suggestions?: string[] | Array<{text: string, value?: string, icon?: string}>;
  
  /** Whether to show dividers between suggestion groups */
  showDividers?: boolean;

  /** Additional CSS classes */
  class?: string;
  
  /** Maximum width of the search component in pixels */
  maxWidth?: number;
  
  /** Minimum width of the search component in pixels */
  minWidth?: number;
  
  /** Whether the search component is full-width */
  fullWidth?: boolean;
  
  /** Event handlers for search events */
  on?: {
    [key in keyof typeof SEARCH_EVENTS | typeof SEARCH_EVENTS[keyof typeof SEARCH_EVENTS]]?: (event: SearchEvent) => void;
  };
}

/**
 * Search event data
 */
export interface SearchEvent {
  /** The search component that triggered the event */
  search: any;
  
  /** Current search value */
  value: string;
  
  /** Original DOM event if available */
  originalEvent: Event | null;
  
  /** Function to prevent default behavior */
  preventDefault: () => void;
  
  /** Whether default behavior was prevented */
  defaultPrevented: boolean;
}

/**
 * Search component public API interface
 */
export interface SearchComponent {
  /** The root element of the search component */
  element: HTMLElement;
  
  /** Sets the search value */
  setValue: (value: string, triggerEvent?: boolean) => SearchComponent;
  
  /** Gets the search value */
  getValue: () => string;
  
  /** Sets placeholder text */
  setPlaceholder: (text: string) => SearchComponent;
  
  /** Gets placeholder text */
  getPlaceholder: () => string;
  
  /** Sets leading icon */
  setLeadingIcon: (iconHtml: string) => SearchComponent;
  
  /** Sets trailing icon */
  setTrailingIcon: (iconHtml: string) => SearchComponent;
  
  /** Sets second trailing icon */
  setTrailingIcon2: (iconHtml: string) => SearchComponent;
  
  /** Sets avatar */
  setAvatar: (avatarHtml: string) => SearchComponent;
  
  /** Shows or hides clear button */
  showClearButton: (show: boolean) => SearchComponent;
  
  /** Updates suggestions */
  setSuggestions: (suggestions: string[] | Array<{text: string, value?: string, icon?: string}>) => SearchComponent;
  
  /** Shows or hides suggestions */
  showSuggestions: (show: boolean) => SearchComponent;
  
  /** Focuses the search input */
  focus: () => SearchComponent;
  
  /** Blurs the search input */
  blur: () => SearchComponent;
  
  /** Expands the search bar into view mode (if in bar mode) */
  expand: () => SearchComponent;
  
  /** Collapses the search view back to bar mode */
  collapse: () => SearchComponent;
  
  /** Clears the search input */
  clear: () => SearchComponent;
  
  /** Submits the search */
  submit: () => SearchComponent;
  
  /** Enables the search component */
  enable: () => SearchComponent;
  
  /** Disables the search component */
  disable: () => SearchComponent;
  
  /** Checks if search is disabled */
  isDisabled: () => boolean;
  
  /** Adds event listener */
  on: (event: keyof typeof SEARCH_EVENTS | typeof SEARCH_EVENTS[keyof typeof SEARCH_EVENTS], handler: (event: SearchEvent) => void) => SearchComponent;
  
  /** Removes event listener */
  off: (event: keyof typeof SEARCH_EVENTS | typeof SEARCH_EVENTS[keyof typeof SEARCH_EVENTS], handler: (event: SearchEvent) => void) => SearchComponent;
  
  /** Destroys the search component and cleans up resources */
  destroy: () => void;
}