// test/core/dom.classes.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { addClass, removeClass, toggleClass, hasClass } from '../../../src/core/dom/classes';
import { PREFIX } from '../../../src/core/config';

// Setup jsdom environment
let dom: JSDOM;
let window: Window;
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
  global.window = window;
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
    expect(element.classList.contains(`${PREFIX}-test`)).toBe(true);
  });
  
  test('should add multiple classes', () => {
    const element = document.createElement('div');
    addClass(element, 'test1', 'test2', 'test3');
    expect(element.classList.contains(`${PREFIX}-test1`)).toBe(true);
    expect(element.classList.contains(`${PREFIX}-test2`)).toBe(true);
    expect(element.classList.contains(`${PREFIX}-test3`)).toBe(true);
  });
  
  test('should add classes from an array', () => {
    const element = document.createElement('div');
    addClass(element, ['test1', 'test2', 'test3']);
    expect(element.classList.contains(`${PREFIX}-test1`)).toBe(true);
    expect(element.classList.contains(`${PREFIX}-test2`)).toBe(true);
    expect(element.classList.contains(`${PREFIX}-test3`)).toBe(true);
  });
  
  test('should add classes from space-separated strings', () => {
    const element = document.createElement('div');
    addClass(element, 'test1 test2', 'test3');
    expect(element.classList.contains(`${PREFIX}-test1`)).toBe(true);
    expect(element.classList.contains(`${PREFIX}-test2`)).toBe(true);
    expect(element.classList.contains(`${PREFIX}-test3`)).toBe(true);
  });
  
  test('should not add empty classes', () => {
    const element = document.createElement('div');
    addClass(element, '', '  ', 'test');
    expect(element.classList.contains('')).toBe(false);
    expect(element.classList.contains('  ')).toBe(false);
    expect(element.classList.contains(`${PREFIX}-test`)).toBe(true);
    expect(element.className).toBe(`${PREFIX}-test`);
  });
  
  test('should remove a single class', () => {
    const element = document.createElement('div');
    element.classList.add(`${PREFIX}-test`);
    removeClass(element, 'test');
    expect(element.classList.contains(`${PREFIX}-test`)).toBe(false);
  });
  
  test('should remove multiple classes', () => {
    const element = document.createElement('div');
    element.classList.add(`${PREFIX}-test1`, `${PREFIX}-test2`, `${PREFIX}-test3`);
    removeClass(element, 'test1', 'test3');
    expect(element.classList.contains(`${PREFIX}-test1`)).toBe(false);
    expect(element.classList.contains(`${PREFIX}-test2`)).toBe(true);
    expect(element.classList.contains(`${PREFIX}-test3`)).toBe(false);
  });
  
  test('should remove classes from an array', () => {
    const element = document.createElement('div');
    element.classList.add(`${PREFIX}-test1`, `${PREFIX}-test2`, `${PREFIX}-test3`);
    removeClass(element, ['test1', 'test3']);
    expect(element.classList.contains(`${PREFIX}-test1`)).toBe(false);
    expect(element.classList.contains(`${PREFIX}-test2`)).toBe(true);
    expect(element.classList.contains(`${PREFIX}-test3`)).toBe(false);
  });
  
  test('should toggle a single class', () => {
    const element = document.createElement('div');
    toggleClass(element, 'test');
    expect(element.classList.contains(`${PREFIX}-test`)).toBe(true);
    toggleClass(element, 'test');
    expect(element.classList.contains(`${PREFIX}-test`)).toBe(false);
  });
  
  test('should toggle multiple classes', () => {
    const element = document.createElement('div');
    toggleClass(element, 'test1', 'test2');
    expect(element.classList.contains(`${PREFIX}-test1`)).toBe(true);
    expect(element.classList.contains(`${PREFIX}-test2`)).toBe(true);
    toggleClass(element, 'test1', 'test3');
    expect(element.classList.contains(`${PREFIX}-test1`)).toBe(false);
    expect(element.classList.contains(`${PREFIX}-test2`)).toBe(true);
    expect(element.classList.contains(`${PREFIX}-test3`)).toBe(true);
  });
  
  test('should check if element has a class', () => {
    const element = document.createElement('div');
    element.classList.add(`${PREFIX}-test1`, `${PREFIX}-test2`);
    expect(hasClass(element, 'test1')).toBe(true);
    expect(hasClass(element, 'test3')).toBe(false);
  });
  
  test('should check if element has multiple classes', () => {
    const element = document.createElement('div');
    element.classList.add(`${PREFIX}-test1`, `${PREFIX}-test2`, `${PREFIX}-test3`);
    expect(hasClass(element, 'test1', 'test2')).toBe(true);
    expect(hasClass(element, 'test1', 'test4')).toBe(false);
  });
  
  test('should handle classes that already have prefix', () => {
    const element = document.createElement('div');
    addClass(element, `${PREFIX}-prefixed-already`);
    expect(element.classList.contains(`${PREFIX}-prefixed-already`)).toBe(true);
    // Make sure it doesn't double prefix
    expect(element.classList.contains(`${PREFIX}-${PREFIX}-prefixed-already`)).toBe(false);
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