// test/setup.ts
import { JSDOM } from 'jsdom';

// Set up a basic DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  contentType: 'text/html',
  includeNodeLocations: true,
  storageQuota: 10000000
});

// Use type assertions to avoid TypeScript errors
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).navigator = dom.window.navigator;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).Element = dom.window.Element;
(global as any).Node = dom.window.Node;
(global as any).Event = dom.window.Event;
(global as any).KeyboardEvent = dom.window.KeyboardEvent;
(global as any).MouseEvent = dom.window.MouseEvent;
(global as any).CustomEvent = dom.window.CustomEvent;
(global as any).DOMRect = dom.window.DOMRect;
(global as any).HTMLButtonElement = dom.window.HTMLButtonElement;
(global as any).HTMLInputElement = dom.window.HTMLInputElement;
(global as any).HTMLDivElement = dom.window.HTMLDivElement;
(global as any).Touch = dom.window.Touch;
(global as any).TouchEvent = dom.window.TouchEvent;
(global as any).DocumentFragment = dom.window.DocumentFragment;
(global as any).DOMParser = dom.window.DOMParser;

// Add any additional DOM-related setup if needed