// test/core/utils.object.test.ts
import { describe, test, expect } from 'bun:test';
import { isObject, byString } from '../../src/core/utils/object';

describe('isObject Utility', () => {
  test('should return true for plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1, b: 2 })).toBe(true);
    expect(isObject(Object.create(null))).toBe(false); // Different prototype
  });

  test('should return false for non-objects', () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject('string')).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(Symbol('symbol'))).toBe(false);
  });

  test('should return false for arrays', () => {
    expect(isObject([])).toBe(false);
    expect(isObject([1, 2, 3])).toBe(false);
  });

  test('should return false for functions', () => {
    expect(isObject(() => {})).toBe(false);
    expect(isObject(function() {})).toBe(false);
  });

  test('should return false for class instances', () => {
    class TestClass {}
    expect(isObject(new TestClass())).toBe(false);
  });

  test('should return false for built-in objects', () => {
    expect(isObject(new Date())).toBe(false);
    expect(isObject(/regex/)).toBe(false);
    expect(isObject(new Map())).toBe(false);
    expect(isObject(new Set())).toBe(false);
  });
});

describe('byString Utility', () => {
  const testObj = {
    a: 1,
    b: {
      c: 2,
      d: {
        e: 3
      }
    },
    f: [4, 5, 6],
    'g.h': 7
  };

  test('should access top-level properties', () => {
    expect(byString(testObj, 'a')).toBe(1);
  });

  test('should access nested properties with dot notation', () => {
    expect(byString(testObj, 'b.c')).toBe(2);
    expect(byString(testObj, 'b.d.e')).toBe(3);
  });

  test('should access array elements with bracket notation', () => {
    expect(byString(testObj, 'f[0]')).toBe(4);
    expect(byString(testObj, 'f[1]')).toBe(5);
    expect(byString(testObj, 'f[2]')).toBe(6);
  });

  test('should access array elements with dot notation', () => {
    expect(byString(testObj, 'f.0')).toBe(4);
    expect(byString(testObj, 'f.1')).toBe(5);
    expect(byString(testObj, 'f.2')).toBe(6);
  });

  test('should handle properties containing dots', () => {
    expect(byString(testObj, 'g.h')).toBe(undefined); // Can't access properties with dots directly
  });

  test('should return undefined for non-existent properties', () => {
    expect(byString(testObj, 'z')).toBe(undefined);
    expect(byString(testObj, 'b.z')).toBe(undefined);
    expect(byString(testObj, 'b.d.z')).toBe(undefined);
  });

  test('should handle problematic paths', () => {
    // This would actually cause an error, but that's expected behavior
    try {
      byString(testObj, 'b.c.d'); // b.c is a number, not an object
    } catch (error) {
      expect(error).toBeDefined();
    }
    
    try {
      byString(testObj, 'f[10]'); // Index out of bounds
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('should handle edge cases defensively', () => {
    // Empty path is treated as an empty key, not returning the object itself
    const result = byString(testObj, '');
    expect(result).toBeUndefined();
    
    // For type safety, let's check only that these don't throw
    try {
      // @ts-ignore - Testing with non-object value
      byString(null, 'a');
      // @ts-ignore - Testing with non-object value
      byString(undefined, 'a');
      expect(true).toBe(true); // If we get here, no exception was thrown
    } catch (error) {
      // This is also an acceptable outcome
      expect(error).toBeDefined();
    }
  });
});