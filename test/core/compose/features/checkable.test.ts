// test/core/compose/features/checkable.test.ts
//
// This suite sat in the tree as `checkable.ts` — without the `.test.ts`
// suffix — so bun never collected it. When it was finally renamed and run, six
// of its tests failed against an API this enhancer has never had: a flat
// `enhanced.setChecked()` / `enhanced.isChecked()`, where the real surface is
// the nested `enhanced.checkable` manager. Three others hardcoded
// `mtrl-switch--checked` while the test helper names itself `test-component`,
// so they asserted a class that could never appear.
//
// The class is now derived from the component under test rather than written
// out, so it cannot drift again. See scripts/check-test-naming.ts.
import { describe, test, expect, beforeEach } from 'bun:test';
import { withCheckable } from '../../../../src/core/compose/features/checkable';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup
import { createTestInputComponent } from './test-helpers';

/** The class withCheckable actually stamps, for whatever component this is. */
const checkedClass = (component) =>
  `${component.getClass(component.componentName)}--checked`;

describe('withCheckable', () => {
  let inputComponent;

  beforeEach(() => {
    document.body.innerHTML = '';
    inputComponent = createTestInputComponent();
  });

  test('exposes the checkable manager, not a flat checked API', () => {
    const enhanced = withCheckable({})(inputComponent);

    // Asserting the absence of the flat API is deliberate: this suite spent
    // months unrun while asserting `setChecked`, which never existed here.
    expect(enhanced.checkable).toBeDefined();
    expect(enhanced.setChecked).toBeUndefined();
    expect(enhanced.isChecked).toBeUndefined();
    expect(enhanced.checkable.isChecked()).toBe(false);
  });

  test('should initialize checked state from config', () => {
    const enhanced = withCheckable({ checked: true })(inputComponent);

    expect(enhanced.checkable.isChecked()).toBe(true);
    expect(enhanced.input.checked).toBe(true);
  });

  test('should set checked state through the manager', () => {
    const enhanced = withCheckable({})(inputComponent);

    enhanced.checkable.check();

    expect(enhanced.checkable.isChecked()).toBe(true);
    expect(enhanced.input.checked).toBe(true);

    enhanced.checkable.uncheck();

    expect(enhanced.checkable.isChecked()).toBe(false);
    expect(enhanced.input.checked).toBe(false);
  });

  test('should add checkable methods to component', () => {
    const enhanced = withCheckable()(inputComponent);

    expect(enhanced.checkable).toBeDefined();
    expect(typeof enhanced.checkable.check).toBe('function');
    expect(typeof enhanced.checkable.uncheck).toBe('function');
    expect(typeof enhanced.checkable.toggle).toBe('function');
    expect(typeof enhanced.checkable.isChecked).toBe('function');
  });

  test('should set initial checked state if specified', () => {
    const config = { checked: true };
    const enhanced = withCheckable(config)(inputComponent);

    expect(enhanced.input.checked).toBe(true);
    expect(enhanced.element.classList.contains(checkedClass(enhanced))).toBe(true);
  });

  test('should not add checkable if input is missing', () => {
    const componentWithoutInput = {
      element: document.createElement('div')
    };

    const enhanced = withCheckable()(componentWithoutInput);

    expect(enhanced).toBe(componentWithoutInput);
    expect(enhanced.checkable).toBeUndefined();
  });

  test('check method should set checked to true', () => {
    const enhanced = withCheckable()(inputComponent);

    // Initially unchecked
    expect(enhanced.input.checked).toBe(false);

    enhanced.checkable.check();

    expect(enhanced.input.checked).toBe(true);
    expect(enhanced.element.classList.contains(checkedClass(enhanced))).toBe(true);
  });

  test('check method should not emit event if already checked', () => {
    const enhanced = withCheckable({ checked: true })(inputComponent);

    enhanced.checkable.check();

    expect(enhanced.input.checked).toBe(true);
  });

  test('uncheck method should set checked to false', () => {
    const enhanced = withCheckable({ checked: true })(inputComponent);

    // The class is present first, so its removal below is a real assertion
    // rather than one that passes because the name never matched.
    expect(enhanced.element.classList.contains(checkedClass(enhanced))).toBe(true);

    enhanced.checkable.uncheck();

    expect(enhanced.input.checked).toBe(false);
    expect(enhanced.element.classList.contains(checkedClass(enhanced))).toBe(false);
  });

  test('toggle method should toggle checked state', () => {
    const enhanced = withCheckable()(inputComponent);

    // Initially unchecked
    expect(enhanced.input.checked).toBe(false);

    enhanced.checkable.toggle();

    // Should now be checked
    expect(enhanced.input.checked).toBe(true);
    expect(enhanced.element.classList.contains(checkedClass(enhanced))).toBe(true);

    enhanced.checkable.toggle();

    expect(enhanced.input.checked).toBe(false);
    expect(enhanced.element.classList.contains(checkedClass(enhanced))).toBe(false);
  });

  test('isChecked method should return current checked state', () => {
    const enhanced = withCheckable()(inputComponent);

    // Initially unchecked
    expect(enhanced.checkable.isChecked()).toBe(false);

    enhanced.input.checked = true;

    expect(enhanced.checkable.isChecked()).toBe(true);
  });

  test('should allow chaining of checkable methods', () => {
    const enhanced = withCheckable()(inputComponent);

    // Should allow chaining
    const result1 = enhanced.checkable.check();
    expect(result1).toBe(enhanced.checkable);

    const result2 = enhanced.checkable.uncheck();
    expect(result2).toBe(enhanced.checkable);

    const result3 = enhanced.checkable.toggle();
    expect(result3).toBe(enhanced.checkable);
  });

  test('should handle emit being undefined', () => {
    // Component without emit method
    const componentWithoutEmit = {
      element: document.createElement('div'),
      input: document.createElement('input'),
      getClass: (name) => `${PREFIX}-${name}`
    };
    componentWithoutEmit.input.type = 'checkbox';

    const enhanced = withCheckable()(componentWithoutEmit);

    // Should not throw when methods are called
    expect(() => enhanced.checkable.check()).not.toThrow();
    expect(() => enhanced.checkable.uncheck()).not.toThrow();
    expect(() => enhanced.checkable.toggle()).not.toThrow();
  });
});
