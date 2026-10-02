// test/components/on-option-pair.ts
//
// A config on* option and an on(event) listener added after creation. The
// option is registered first, so it runs first, and both receive one argument:
// the same object when the event has a payload, undefined when it has none.
import { expect } from "bun:test";

export interface OptionPair {
  option: (payload?: unknown) => void;
  listener: (payload?: unknown) => void;
  optionCalls: unknown[];
  listenerCalls: unknown[];
  order: Array<"option" | "listener">;
}

export const optionPair = (): OptionPair => {
  const optionCalls: unknown[] = [];
  const listenerCalls: unknown[] = [];
  const order: Array<"option" | "listener"> = [];
  return {
    option: (payload?: unknown) => {
      order.push("option");
      optionCalls.push(payload);
    },
    listener: (payload?: unknown) => {
      order.push("listener");
      listenerCalls.push(payload);
    },
    optionCalls,
    listenerCalls,
    order,
  };
};

/** Same count, same argument by identity, and the option before the later listener. */
export const expectSameListener = (seen: OptionPair): void => {
  expect(seen.optionCalls.length).toBe(seen.listenerCalls.length);
  expect(seen.optionCalls.length).toBeGreaterThan(0);
  for (let i = 0; i < seen.optionCalls.length; i++) {
    expect(seen.optionCalls[i]).toBe(seen.listenerCalls[i]);
  }
  const alternated: Array<"option" | "listener"> = [];
  for (let i = 0; i < seen.optionCalls.length; i++) alternated.push("option", "listener");
  expect(seen.order).toEqual(alternated);
};
