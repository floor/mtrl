// test/core/dom.classes.test.ts
//
// These helpers used to prefix every class name with `mtrl-`, so a consumer's
// `class: "custom-button"` landed as `mtrl-custom-button` and could not be
// styled by the name they wrote (FLO-117). They now take names exactly as
// given; prefixing belongs to `getClass()`, which internal code uses at the
// call site. The assertions below are written with bare names for that reason
// -- they used to read `${PREFIX}-test` on both the seed and the assertion.
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { addClass, removeClass, toggleClass, hasClass } from '../../../src/core/dom/classes';

// Setup jsdom environment
let dom: JSDOM;
let window: JSDOM['window'];
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;

beforeAll(() => {
  // Create a new JSDOM instance
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true
  });
  
  // Get window and document from jsdom
  window = dom.window;
  document = window.document;
  
  // Store original globals
  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;
  
  // Set globals to use jsdom
  global.document = document;
  global.window = window as unknown as Window & typeof globalThis;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});

describe('DOM Classes Utilities', () => {
  test('should add a single class', () => {
    const element = document.createElement('div');
    addClass(element, 'test');
    expect(element.classList.contains('test')).toBe(true);
  });
  
  test('should add multiple classes', () => {
    const element = document.createElement('div');
    addClass(element, 'test1', 'test2', 'test3');
    expect(element.classList.contains('test1')).toBe(true);
    expect(element.classList.contains('test2')).toBe(true);
    expect(element.classList.contains('test3')).toBe(true);
  });
  
  test('should add classes from an array', () => {
    const element = document.createElement('div');
    addClass(element, ['test1', 'test2', 'test3']);
    expect(element.classList.contains('test1')).toBe(true);
    expect(element.classList.contains('test2')).toBe(true);
    expect(element.classList.contains('test3')).toBe(true);
  });
  
  test('should add classes from space-separated strings', () => {
    const element = document.createElement('div');
    addClass(element, 'test1 test2', 'test3');
    expect(element.classList.contains('test1')).toBe(true);
    expect(element.classList.contains('test2')).toBe(true);
    expect(element.classList.contains('test3')).toBe(true);
  });
  
  test('should not add empty classes', () => {
    const element = document.createElement('div');
    addClass(element, '', '  ', 'test');
    expect(element.classList.contains('')).toBe(false);
    expect(element.classList.contains('  ')).toBe(false);
    expect(element.classList.contains('test')).toBe(true);
    expect(element.className).toBe('test');
  });
  
  test('should remove a single class', () => {
    const element = document.createElement('div');
    element.classList.add('test');
    removeClass(element, 'test');
    expect(element.classList.contains('test')).toBe(false);
  });
  
  test('should remove multiple classes', () => {
    const element = document.createElement('div');
    element.classList.add('test1', 'test2', 'test3');
    removeClass(element, 'test1', 'test3');
    expect(element.classList.contains('test1')).toBe(false);
    expect(element.classList.contains('test2')).toBe(true);
    expect(element.classList.contains('test3')).toBe(false);
  });
  
  test('should remove classes from an array', () => {
    const element = document.createElement('div');
    element.classList.add('test1', 'test2', 'test3');
    removeClass(element, ['test1', 'test3']);
    expect(element.classList.contains('test1')).toBe(false);
    expect(element.classList.contains('test2')).toBe(true);
    expect(element.classList.contains('test3')).toBe(false);
  });
  
  test('should toggle a single class', () => {
    const element = document.createElement('div');
    toggleClass(element, 'test');
    expect(element.classList.contains('test')).toBe(true);
    toggleClass(element, 'test');
    expect(element.classList.contains('test')).toBe(false);
  });
  
  test('should toggle multiple classes', () => {
    const element = document.createElement('div');
    toggleClass(element, 'test1', 'test2');
    expect(element.classList.contains('test1')).toBe(true);
    expect(element.classList.contains('test2')).toBe(true);
    toggleClass(element, 'test1', 'test3');
    expect(element.classList.contains('test1')).toBe(false);
    expect(element.classList.contains('test2')).toBe(true);
    expect(element.classList.contains('test3')).toBe(true);
  });
  
  test('should check if element has a class', () => {
    const element = document.createElement('div');
    element.classList.add('test1', 'test2');
    expect(hasClass(element, 'test1')).toBe(true);
    expect(hasClass(element, 'test3')).toBe(false);
  });
  
  test('should check if element has multiple classes', () => {
    const element = document.createElement('div');
    element.classList.add('test1', 'test2', 'test3');
    expect(hasClass(element, 'test1', 'test2')).toBe(true);
    expect(hasClass(element, 'test1', 'test4')).toBe(false);
  });
  
  // Named for a case it did not test: 'prefixed-already' merely starts with
  // the word, it never carried the `mtrl-` prefix. The real case -- a name
  // that does -- is covered in 'an already-prefixed name is passed through
  // unchanged' below.
  test('a name that merely looks prefixed is left alone', () => {
    const element = document.createElement('div');
    addClass(element, 'prefixed-already');
    expect(element.className).toBe('prefixed-already');
  });
  
  test('should return the element from modifier functions', () => {
    const element = document.createElement('div');
    const result1 = addClass(element, 'test');
    const result2 = removeClass(element, 'test');
    const result3 = toggleClass(element, 'test');
    
    expect(result1).toBe(element);
    expect(result2).toBe(element);
    expect(result3).toBe(element);
  });
});

// The point of FLO-117, stated directly rather than implied by the cases above.
describe('class names are taken exactly as given', () => {
  test('a consumer class is not prefixed', () => {
    const element = document.createElement('div');

    addClass(element, 'custom-button');

    expect(element.className).toBe('custom-button');
    expect(element.classList.contains('mtrl-custom-button')).toBe(false);
  });

  // A name that already carries the prefix is still left alone -- it is not
  // stripped, and it is not prefixed twice.
  test('an already-prefixed name is passed through unchanged', () => {
    const element = document.createElement('div');

    addClass(element, 'mtrl-button');

    expect(element.className).toBe('mtrl-button');
    expect(element.classList.contains('mtrl-mtrl-button')).toBe(false);
  });

  test('removeClass and hasClass agree with addClass about the name', () => {
    const element = document.createElement('div');
    addClass(element, 'custom-button');

    expect(hasClass(element, 'custom-button')).toBe(true);
    expect(hasClass(element, 'mtrl-custom-button')).toBe(false);

    removeClass(element, 'custom-button');
    expect(element.className).toBe('');
  });

  test('toggleClass uses the same name', () => {
    const element = document.createElement('div');

    toggleClass(element, 'custom-button');
    expect(element.classList.contains('custom-button')).toBe(true);

    toggleClass(element, 'custom-button');
    expect(element.classList.contains('custom-button')).toBe(false);
  });
});
