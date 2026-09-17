// Type declarations for JSDOM compatibility

import { JSDOM } from 'jsdom';

// Extend Window interface to work with JSDOM
interface Window {
  Element: typeof Element;
  HTMLElement: typeof HTMLElement;
  HTMLButtonElement: typeof HTMLButtonElement;
  HTMLInputElement: typeof HTMLInputElement;
  HTMLDivElement: typeof HTMLDivElement;
  Event: typeof Event;
  CustomEvent: typeof CustomEvent;
  MouseEvent: typeof MouseEvent;
  KeyboardEvent: typeof KeyboardEvent;
  TouchEvent: typeof TouchEvent;
  Touch: typeof Touch;
  Node: typeof Node;
  DOMRect: typeof DOMRect;
  DocumentFragment: typeof DocumentFragment;
  DOMParser: typeof DOMParser;
}

// Type guard to enable DOM Window assignment
type SafeDOMWindow = Window & typeof globalThis;

// Extend Element interface to include style property and other missing properties
interface Element {
  style: CSSStyleDeclaration;
  type?: string;
  disabled?: boolean;
  tagName: string;
}

// Add tagName to ChildNode
interface ChildNode {
  tagName?: string;
}

// Extend Object to allow arbitrary properties in test configs
interface Object {
  [key: string]: any;
}

// Allow scrollY to be mutable for testing
interface Window {
  scrollY: number;
}

// Extend HTMLElement with additional properties needed in tests
interface HTMLElement {
  type?: string;
  disabled?: boolean;
}

// List component extensions
interface ListConfig {
  renderItem?: any;
  type?: string;
  prefix?: string;
  items?: any[];
}

interface ListComponent {
  prefix?: string;
  getSelected?: () => any;
  setSelected?: (value: any) => any;
  addItem?: (item: any) => any;
  removeItem?: (id: string) => any;
  config?: any;
}

// Switch component extensions
interface SwitchConfig {
  labelPosition?: string;
}

interface SwitchComponent {
  config?: any;
  emit?: (event: string, data: any) => any;
}

// Snackbar component extensions
interface SnackbarComponent {
  config?: any;
  emit?: (event: string, data: any) => any;
}

// Textfield component extensions
interface TextfieldConfig {
  size?: string;
  placeholder?: string;
}

interface TextfieldComponent {
  config?: any;
}

// TopAppBar extensions
interface TopAppBar {
  on?: (event: string, handler: Function) => any;
}

// Tooltip extensions
type TooltipPosition = string;

// Extend NodeJS global interface
declare global {
  namespace NodeJS {
    interface Global {
      window: Window;
      document: Document;
      navigator: Navigator;
      HTMLElement: typeof HTMLElement;
      Element: typeof Element;
      Node: typeof Node;
      Event: typeof Event;
      KeyboardEvent: typeof KeyboardEvent;
      MouseEvent: typeof MouseEvent;
      CustomEvent: typeof CustomEvent;
      DOMRect: typeof DOMRect;
    }
  }
}

// No `declare module 'bun:test'` here, and none in a sibling .d.ts either.
// Two hand-written copies of it used to shadow the real @types/bun: `expect`
// and `mock` were declared `any`, so all 3,873 assertions and 82 mock() calls
// in this tree type-checked against nothing, while a 2-argument `test`
// signature rejected the valid 3-argument form that bun accepts and two
// segmented-button suites use. They hid real errors and invented false ones at
// once. The real types come from `"types": ["bun"]` in tsconfig.test.json.
