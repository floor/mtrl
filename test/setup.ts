// test/setup.ts
import { JSDOM } from 'jsdom';

// Set up a basic DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  contentType: 'text/html',
  includeNodeLocations: true,
  storageQuota: 10000000
});

// Make DOM globals available
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.Event = dom.window.Event;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.MouseEvent = dom.window.MouseEvent;
global.CustomEvent = dom.window.CustomEvent;
global.DOMRect = dom.window.DOMRect;

// Add any additional DOM-related setup if needed