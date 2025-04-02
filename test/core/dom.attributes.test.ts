// test/core/dom.attributes.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { setAttributes, removeAttributes } from '../../src/core/dom/attributes';

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

describe('DOM Attributes Utilities', () => {
  test('should set a single attribute', () => {
    const element = document.createElement('div');
    setAttributes(element, { id: 'test-id' });
    expect(element.getAttribute('id')).toBe('test-id');
  });
  
  test('should set multiple attributes', () => {
    const element = document.createElement('div');
    setAttributes(element, {
      id: 'test-id',
      class: 'test-class',
      'data-test': 'test-data'
    });
    
    expect(element.getAttribute('id')).toBe('test-id');
    expect(element.getAttribute('class')).toBe('test-class');
    expect(element.getAttribute('data-test')).toBe('test-data');
  });
  
  test('should convert attribute values to strings', () => {
    const element = document.createElement('div');
    setAttributes(element, {
      'data-number': 123,
      'data-boolean': true,
      'data-object': { toString: () => 'object-string' }
    });
    
    expect(element.getAttribute('data-number')).toBe('123');
    expect(element.getAttribute('data-boolean')).toBe('true');
    expect(element.getAttribute('data-object')).toBe('object-string');
  });
  
  test('should handle empty attributes object', () => {
    const element = document.createElement('div');
    element.setAttribute('test', 'value');
    
    setAttributes(element, {});
    
    expect(element.getAttribute('test')).toBe('value');
  });
  
  test('should skip null or undefined attribute values', () => {
    const element = document.createElement('div');
    setAttributes(element, {
      'data-defined': 'value',
      'data-null': null,
      'data-undefined': undefined
    });
    
    expect(element.getAttribute('data-defined')).toBe('value');
    expect(element.hasAttribute('data-null')).toBe(false);
    expect(element.hasAttribute('data-undefined')).toBe(false);
  });
  
  test('should remove a single attribute', () => {
    const element = document.createElement('div');
    element.setAttribute('id', 'test-id');
    
    removeAttributes(element, ['id']);
    
    expect(element.hasAttribute('id')).toBe(false);
  });
  
  test('should remove multiple attributes', () => {
    const element = document.createElement('div');
    element.setAttribute('id', 'test-id');
    element.setAttribute('class', 'test-class');
    element.setAttribute('data-test', 'test-data');
    
    removeAttributes(element, ['id', 'data-test']);
    
    expect(element.hasAttribute('id')).toBe(false);
    expect(element.getAttribute('class')).toBe('test-class');
    expect(element.hasAttribute('data-test')).toBe(false);
  });
  
  test('should handle empty attributes array', () => {
    const element = document.createElement('div');
    element.setAttribute('test', 'value');
    
    removeAttributes(element, []);
    
    expect(element.getAttribute('test')).toBe('value');
  });
  
  test('should silently ignore non-existent attributes', () => {
    const element = document.createElement('div');
    element.setAttribute('id', 'test-id');
    
    removeAttributes(element, ['id', 'non-existent']);
    
    expect(element.hasAttribute('id')).toBe(false);
  });
  
  test('should return the element from modifier functions', () => {
    const element = document.createElement('div');
    
    const result1 = setAttributes(element, { test: 'value' });
    const result2 = removeAttributes(element, ['test']);
    
    expect(result1).toBe(element);
    expect(result2).toBe(element);
  });
});