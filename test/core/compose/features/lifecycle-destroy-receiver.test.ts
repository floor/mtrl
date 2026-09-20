// test/core/compose/features/lifecycle-destroy-receiver.test.ts
//
// `lifecycle.destroy` used to be a method that called `this.unmount()`. Around
// twenty feature wrappers save it and call it back as a plain function —
// `const originalDestroy = component.lifecycle.destroy; … originalDestroy()` —
// which leaves `this` undefined. On a mounted component that threw, and the
// wrapper's own cleanup never finished.
//
// These tests call destroy the way those wrappers do. The sibling suite,
// lifecycle.test.ts, mocks the emitter module, so it cannot see this: with a
// shared mock object the `this` binding resolves to something either way.
// Everything here uses the real emitter.

import { describe, test, expect } from "bun:test";
import { withLifecycle } from "../../../../src/core/compose/features/lifecycle";
import { createBase, withElement } from "../../../../src/core/compose/component";
import "../../../setup"; // jsdom

/** A component built the way the real ones are, then given a lifecycle. */
const componentWithLifecycle = () =>
  withLifecycle()(
    withElement({ tag: "div" })(
      createBase({ componentName: "test", parent: document.body }),
    ),
  );

describe("lifecycle.destroy does not depend on its receiver", () => {
  test("a detached destroy runs on a mounted component", () => {
    const component = componentWithLifecycle();
    component.lifecycle.mount();
    expect(component.lifecycle.isMounted()).toBe(true);

    // Exactly what the wrappers do: no receiver.
    const detached = component.lifecycle.destroy;
    expect(() => detached()).not.toThrow();

    expect(component.lifecycle.isMounted()).toBe(false);
  });

  test("it still unmounts, so onUnmount handlers are not skipped", () => {
    const component = componentWithLifecycle();
    let unmounted = false;
    component.lifecycle.onUnmount(() => {
      unmounted = true;
    });
    component.lifecycle.mount();

    const detached = component.lifecycle.destroy;
    detached();

    expect(unmounted).toBe(true);
  });

  test("it removes the element, so destruction completes", () => {
    const component = componentWithLifecycle();
    component.lifecycle.mount();
    expect(component.element.isConnected).toBe(true);

    const detached = component.lifecycle.destroy;
    detached();

    expect(component.element.isConnected).toBe(false);
  });

  // The real shape of the defect: a feature wraps destroy, adds its own
  // cleanup, and calls the original. When the original threw, the wrapper's
  // later statements never ran either.
  test("a wrapper's own cleanup completes around it", () => {
    const component = componentWithLifecycle();
    const order: string[] = [];

    const originalDestroy = component.lifecycle.destroy;
    component.lifecycle.destroy = () => {
      order.push("wrapper cleanup");
      originalDestroy();
      order.push("after original");
    };

    component.lifecycle.mount();
    expect(() => component.lifecycle.destroy()).not.toThrow();

    expect(order).toEqual(["wrapper cleanup", "after original"]);
    expect(component.element.isConnected).toBe(false);
  });

  test("an unmounted component is unaffected, as before", () => {
    const component = componentWithLifecycle();
    expect(component.lifecycle.isMounted()).toBe(false);

    const detached = component.lifecycle.destroy;
    expect(() => detached()).not.toThrow();

    expect(component.element.isConnected).toBe(false);
  });

  test("calling it twice is still a no-op the second time", () => {
    const component = componentWithLifecycle();
    let unmountCount = 0;
    component.lifecycle.onUnmount(() => {
      unmountCount += 1;
    });
    component.lifecycle.mount();

    const detached = component.lifecycle.destroy;
    detached();
    detached();

    expect(unmountCount).toBe(1);
  });
});
