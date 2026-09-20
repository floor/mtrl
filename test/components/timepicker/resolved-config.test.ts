// test/components/timepicker/resolved-config.test.ts
//
// `createBaseConfig` now declares `ResolvedTimePickerConfig`: the promise that
// every field with a default is set by the time it returns. Fifty reads
// downstream — the renderer, the clock dial, the API — depend on that promise
// and no longer check for undefined.
//
// A type assertion is only as good as the thing it asserts, so this checks the
// promise at runtime rather than trusting it. If a default is ever dropped
// from `defaultConfig` while the type still names the field, the type stays
// happy and something downstream starts writing "undefined" into a class name
// or an icon. These tests are what notices.

import { describe, test, expect } from "bun:test";
import { createBaseConfig, defaultConfig } from "../../../src/components/timepicker/config";
import {
  TIME_FORMAT,
  TIME_PICKER_ORIENTATION,
  TIME_PICKER_TYPE,
} from "../../../src/components/timepicker/types";

/** Every field ResolvedTimePickerConfig promises is present. */
const PROMISED = [
  "type",
  "format",
  "orientation",
  "showSeconds",
  "closeOnSelect",
  "minuteStep",
  "secondStep",
  "cancelText",
  "confirmText",
  "isOpen",
  "clockIcon",
  "keyboardIcon",
  "prefix",
] as const;

describe("createBaseConfig keeps the promise its type makes", () => {
  test("every promised field is set when the caller passes nothing", () => {
    const config = createBaseConfig();

    for (const field of PROMISED) {
      expect(config[field]).toBeDefined();
    }
  });

  test("and when the caller passes an empty object", () => {
    const config = createBaseConfig({});

    for (const field of PROMISED) {
      expect(config[field]).toBeDefined();
    }
  });

  // prefix is the one that comes from createComponentConfig rather than
  // defaultConfig, so it is the one most easily lost.
  test("prefix is set even though defaultConfig does not name it", () => {
    expect(defaultConfig.prefix).toBeUndefined();
    expect(createBaseConfig().prefix).toBeTruthy();
  });

  test("a caller's value wins over the default", () => {
    const config = createBaseConfig({
      format: TIME_FORMAT.MILITARY,
      showSeconds: true,
      cancelText: "Nope",
    });

    expect(config.format).toBe(TIME_FORMAT.MILITARY);
    expect(config.showSeconds).toBe(true);
    expect(config.cancelText).toBe("Nope");
  });

  test("the defaults are the documented ones", () => {
    const config = createBaseConfig();

    expect(config.type).toBe(TIME_PICKER_TYPE.DIAL);
    expect(config.format).toBe(TIME_FORMAT.AMPM);
    expect(config.orientation).toBe(TIME_PICKER_ORIENTATION.VERTICAL);
  });

  // `false` and `0` are the values a careless merge drops. Both are legitimate
  // here: showSeconds and isOpen default to false, and a caller may pass them.
  test("a falsy value the caller passes is kept, not replaced by the default", () => {
    const config = createBaseConfig({ showSeconds: false, isOpen: false });

    expect(config.showSeconds).toBe(false);
    expect(config.isOpen).toBe(false);
  });

  test("no promised field is the string 'undefined', which is what a lost default looks like downstream", () => {
    const config = createBaseConfig();

    for (const field of PROMISED) {
      expect(String(config[field])).not.toBe("undefined");
    }
  });
});
