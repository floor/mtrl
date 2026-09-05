// test/components/button-toggle.test.ts
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { withToggle } from '../../src/components/button/features/toggle';
import { PREFIX } from '../../src/core/config';
import '../setup';

const createComponent = () => {
  const element = document.createElement('button');
  const emit = mock((_event: string, _data?: unknown) => undefined);
  return {
    element,
    emit,
    getClass: (name: string) => `${PREFIX}-${name}`,
  };
};

describe('withToggle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('leaves a plain button alone', () => {
    const component = createComponent();
    const enhanced = withToggle({})(component);

    expect(enhanced.toggle).toBeUndefined();
    expect(component.element.classList.contains(`${PREFIX}-button--toggle`)).toBe(false);
    expect(component.element.hasAttribute('aria-pressed')).toBe(false);
  });

  test('marks a toggle button and starts unselected', () => {
    const component = createComponent();
    const enhanced = withToggle({ toggle: true })(component);

    expect(component.element.classList.contains(`${PREFIX}-button--toggle`)).toBe(true);
    expect(component.element.classList.contains(`${PREFIX}-button--selected`)).toBe(false);
    expect(component.element.getAttribute('aria-pressed')).toBe('false');
    expect(enhanced.toggle?.isSelected()).toBe(false);
  });

  test('honours the initial selected state', () => {
    const component = createComponent();
    const enhanced = withToggle({ toggle: true, selected: true })(component);

    expect(component.element.classList.contains(`${PREFIX}-button--selected`)).toBe(true);
    expect(component.element.getAttribute('aria-pressed')).toBe('true');
    expect(enhanced.toggle?.isSelected()).toBe(true);
  });

  test('a click flips the state and emits change', () => {
    const component = createComponent();
    const enhanced = withToggle({ toggle: true })(component);

    component.element.click();
    expect(enhanced.toggle?.isSelected()).toBe(true);
    expect(component.element.getAttribute('aria-pressed')).toBe('true');
    expect(component.emit).toHaveBeenCalledWith('change', { selected: true });

    component.element.click();
    expect(enhanced.toggle?.isSelected()).toBe(false);
    expect(component.element.classList.contains(`${PREFIX}-button--selected`)).toBe(false);
    expect(component.emit).toHaveBeenLastCalledWith('change', { selected: false });
  });

  test('a disabled toggle button ignores clicks', () => {
    const component = createComponent();
    component.element.disabled = true;
    const enhanced = withToggle({ toggle: true })(component);

    component.element.dispatchEvent(new Event('click'));
    expect(enhanced.toggle?.isSelected()).toBe(false);
    expect(component.emit).not.toHaveBeenCalled();
  });

  test('setSelected updates class and aria-pressed without emitting', () => {
    const component = createComponent();
    const enhanced = withToggle({ toggle: true })(component);

    enhanced.toggle?.setSelected(true);
    expect(component.element.classList.contains(`${PREFIX}-button--selected`)).toBe(true);
    expect(component.element.getAttribute('aria-pressed')).toBe('true');
    expect(component.emit).not.toHaveBeenCalled();

    enhanced.toggle?.setSelected(false);
    expect(component.element.getAttribute('aria-pressed')).toBe('false');
  });

  test('toggleOnClick false leaves the state to the container', () => {
    const component = createComponent();
    const enhanced = withToggle({ toggle: true, toggleOnClick: false })(component);

    component.element.click();
    expect(enhanced.toggle?.isSelected()).toBe(false);
    expect(component.emit).not.toHaveBeenCalled();

    enhanced.toggle?.setSelected(true);
    expect(component.element.classList.contains(`${PREFIX}-button--selected`)).toBe(true);
  });
});
