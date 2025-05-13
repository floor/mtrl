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

// Provide types for Bun test module
declare module 'bun:test' {
  export const describe: (name: string, fn: () => void) => void;
  export const test: (name: string, fn: () => void | Promise<void>) => void;
  export const expect: any;
  export const beforeEach: (fn: () => void | Promise<void>) => void;
  export const afterEach: (fn: () => void | Promise<void>) => void;
  export const beforeAll: (fn: () => void | Promise<void>) => void;
  export const afterAll: (fn: () => void | Promise<void>) => void;
  export const mock: any;
  export const spyOn: (object: any, method: string) => any;
} 