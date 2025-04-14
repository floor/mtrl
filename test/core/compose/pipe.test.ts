// test/core/compose/pipe.test.ts
import { describe, test, expect } from 'bun:test';
import { pipe, compose, transform } from '../../../src/core/compose/pipe';

describe('Composition Utilities', () => {
  describe('pipe function', () => {
    test('should compose functions from left to right', () => {
      // Define simple transformation functions
      const addOne = (x: number) => x + 1;
      const double = (x: number) => x * 2;
      const square = (x: number) => x * x;
      
      // Create composed functions
      const addOneThenDouble = pipe(addOne, double);
      const doubleThenSquare = pipe(double, square);
      const addOneDoubleThenSquare = pipe(addOne, double, square);
      
      // Test with different inputs
      expect(addOneThenDouble(3)).toBe(8); // (3 + 1) * 2 = 8
      expect(doubleThenSquare(3)).toBe(36); // (3 * 2)^2 = 36
      expect(addOneDoubleThenSquare(3)).toBe(64); // ((3 + 1) * 2)^2 = 64
    });
    
    test('should work with different types', () => {
      const numToString = (n: number) => n.toString();
      const appendExclamation = (s: string) => s + '!';
      const makeArray = (s: string) => [s];
      
      const numToExcitedArray = pipe(numToString, appendExclamation, makeArray);
      
      expect(numToExcitedArray(42)).toEqual(['42!']);
    });
    
    test('should handle single function case', () => {
      const double = (x: number) => x * 2;
      const doublePiped = pipe(double);
      
      expect(doublePiped(5)).toBe(10);
    });
    
    test('should handle zero functions case', () => {
      const identity = pipe();
      
      expect(identity(5)).toBe(5);
      expect(identity('hello')).toBe('hello');
      expect(identity({ a: 1 })).toEqual({ a: 1 });
    });
  });
  
  describe('compose function', () => {
    test('should compose functions from right to left', () => {
      // Define simple transformation functions
      const addOne = (x: number) => x + 1;
      const double = (x: number) => x * 2;
      const square = (x: number) => x * x;
      
      // Create composed functions
      const doubleAfterAddOne = compose(double, addOne);
      const squareAfterDouble = compose(square, double);
      const squareDoubleAfterAddOne = compose(square, double, addOne);
      
      // Test with different inputs
      expect(doubleAfterAddOne(3)).toBe(8); // 2 * (3 + 1) = 8
      expect(squareAfterDouble(3)).toBe(36); // (3 * 2)^2 = 36
      expect(squareDoubleAfterAddOne(3)).toBe(64); // ((3 + 1) * 2)^2 = 64
    });
    
    test('should work with different types', () => {
      const numToString = (n: number) => n.toString();
      const appendExclamation = (s: string) => s + '!';
      const makeArray = (s: string) => [s];
      
      const numToExcitedArray = compose(makeArray, appendExclamation, numToString);
      
      expect(numToExcitedArray(42)).toEqual(['42!']);
    });
    
    test('should handle single function case', () => {
      const double = (x: number) => x * 2;
      const doubleComposed = compose(double);
      
      expect(doubleComposed(5)).toBe(10);
    });
    
    test('should handle zero functions case', () => {
      const identity = compose();
      
      expect(identity(5)).toBe(5);
      expect(identity('hello')).toBe('hello');
      expect(identity({ a: 1 })).toEqual({ a: 1 });
    });
  });
  
  describe('transform function', () => {
    test('should apply transformations with shared context', () => {
      // Define transformer functions
      const withName = (obj: any, context: any) => ({ name: context.name });
      const withAge = (obj: any, context: any) => ({ age: context.age });
      const withGreeting = (obj: any, context: any) => ({ 
        greeting: `Hello, I'm ${obj.name} and I'm ${obj.age} years old`
      });
      
      // Create composed transformer
      const createPerson = transform(withName, withAge, withGreeting);
      
      // Test with context
      const person = createPerson({}, { name: 'John', age: 30 });
      
      expect(person).toEqual({
        name: 'John',
        age: 30,
        greeting: "Hello, I'm John and I'm 30 years old"
      });
    });
    
    test('should handle empty transformers list', () => {
      const noTransform = transform();
      const obj = { existing: 'property' };
      
      expect(noTransform(obj, {})).toBe(obj);
    });
    
    test('should merge properties from transformers', () => {
      const withA = (obj: any) => ({ a: 1 });
      const withB = (obj: any) => ({ b: 2 });
      const withC = (obj: any) => ({ c: 3 });
      
      const withABC = transform(withA, withB, withC);
      
      expect(withABC({})).toEqual({ a: 1, b: 2, c: 3 });
    });
    
    test('should override properties in order', () => {
      const withValue = (obj: any) => ({ value: 'initial' });
      const updateValue = (obj: any) => ({ value: 'updated' });
      const finalUpdate = (obj: any) => ({ value: 'final' });
      
      const withUpdates = transform(withValue, updateValue, finalUpdate);
      
      expect(withUpdates({})).toEqual({ value: 'final' });
    });
    
    test('should respect existing object properties', () => {
      const initialObj = { existing: 'value', overrideMe: 'initial' };
      
      const addProps = (obj: any, context: any) => ({ 
        added: 'new-value',
        overrideMe: 'overridden' 
      });
      
      const transformer = transform(addProps);
      const result = transformer(initialObj);
      
      expect(result).toEqual({
        existing: 'value',
        overrideMe: 'overridden',
        added: 'new-value'
      });
    });
    
    test('should allow transformers to access previously added properties', () => {
      const withBase = (obj: any) => ({ baseProp: 'base' });
      const withDerived = (obj: any) => ({ derivedProp: `derived-from-${obj.baseProp}` });
      
      const transformer = transform(withBase, withDerived);
      const result = transformer({});
      
      expect(result).toEqual({
        baseProp: 'base',
        derivedProp: 'derived-from-base'
      });
    });
    
    test('should allow transformers to use context', () => {
      const withConfig = (obj: any, context: any) => ({ 
        config: context.config 
      });
      
      const withDerivedConfig = (obj: any, context: any) => ({ 
        derivedConfig: `${obj.config}-${context.suffix}` 
      });
      
      const transformer = transform(withConfig, withDerivedConfig);
      const result = transformer({}, { config: 'base-config', suffix: 'extended' });
      
      expect(result).toEqual({
        config: 'base-config',
        derivedConfig: 'base-config-extended'
      });
    });
  });
});