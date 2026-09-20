// test/components/timepicker-tokens.test.ts
//
// The token half of the time picker audit (N25). Every assertion names the
// token it comes from, because the audit's own wording said only "colour roles
// differ" and the source is what settles which role each element should take:
//
//   androidx compose material3 tokens/TimePickerTokens.kt
//   https://github.com/androidx/androidx/blob/androidx-main/compose/material3/
//     material3/src/commonMain/kotlin/androidx/compose/material3/tokens/
//     TimePickerTokens.kt
//
//   HeadlineColor                          = OnSurfaceVariant
//   HeadlineFont                           = LabelMedium
//   PeriodSelectorOutlineColor             = Outline
//   PeriodSelectorSelectedContainerColor   = TertiaryContainer
//   PeriodSelectorSelectedLabelTextColor   = OnTertiaryContainer
//   PeriodSelectorUnselectedLabelTextColor = OnSurfaceVariant
//   TimeSelectorSelectedContainerColor     = PrimaryContainer
//   TimeSelectorSelectedLabelTextColor     = OnPrimaryContainer
//   TimeSelectorUnselectedContainerColor   = SurfaceContainerHighest
//   TimeSelectorUnselectedLabelTextColor   = OnSurface
//   ClockDialColor                         = SurfaceContainerHighest
//   ClockDialSelectedLabelTextColor        = OnPrimary
//   ClockDialSelectorHandleContainerColor  = Primary
//
// The dial is drawn into a canvas rather than styled, so its three tokens are
// checked against clockdial.ts instead of the compiled CSS.

import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compileString } from "sass";

const root = join(import.meta.dir, "../..");

/** The component's stylesheet, compiled with the theme it depends on. */
const css = (() => {
  const source = `
    @use "${root}/src/styles/abstract/base" as base;
    @use "${root}/src/styles/components/timepicker";
  `;
  return compileString(source, { loadPaths: [root, join(root, "src/styles")] }).css;
})();

/**
 * The declarations of the rule whose selector is exactly `selector`.
 *
 * Exactly, because several of these class names are also prefixes of others
 * and appear again inside media queries — a loose match picks up a mobile
 * override rather than the rule that carries the token.
 */
const ruleFor = (selector: string): string => {
  const pattern = new RegExp(`(?:^|[},])\\s*${selector.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s*\\{([^}]*)\\}`, "m");
  return pattern.exec(css)?.[1] ?? "";
};

const dial = readFileSync(join(root, "src/components/timepicker/clockdial.ts"), "utf8");

describe("time picker headline", () => {
  test("HeadlineColor is OnSurfaceVariant", () => {
    expect(ruleFor(".mtrl-time-picker-title")).toContain("on-surface-variant");
  });

  // The one the audit named: it was title-small.
  test("HeadlineFont is LabelMedium", () => {
    const rule = ruleFor(".mtrl-time-picker-title");
    // label-medium compiles to 12px/16px, 0.5px tracking, weight 500.
    // title-small, which it was, is 14px/20px at 0.1px.
    expect(rule).toContain("font-size: 12px");
    expect(rule).toContain("letter-spacing: 0.5px");
    expect(rule).not.toContain("font-size: 14px");
  });
});

describe("period selector colour roles", () => {
  test("PeriodSelectorOutlineColor is Outline, not OutlineVariant", () => {
    const rule = ruleFor(".mtrl-time-picker-period");
    expect(rule).toContain("color-outline)");
    expect(rule).not.toContain("outline-variant");
  });

  test("PeriodSelectorSelectedContainerColor is TertiaryContainer", () => {
    expect(ruleFor(".mtrl-time-picker-period--selected")).toContain("tertiary-container");
  });

  test("PeriodSelectorSelectedLabelTextColor is OnTertiaryContainer", () => {
    expect(ruleFor(".mtrl-time-picker-period--selected")).toContain("on-tertiary-container");
  });

  // Primary-container is the time selector's pair. Using it here is what made
  // AM/PM and the hour field look like the same control.
  test("the selected period does not borrow the time selector's colours", () => {
    const rule = ruleFor(".mtrl-time-picker-period--selected");
    expect(rule).not.toMatch(/on-primary-container|sys-color-primary-container/);
  });
});

describe("time selector colour roles", () => {
  test("TimeSelectorUnselectedContainerColor is SurfaceContainerHighest", () => {
    expect(css).toContain("surface-container-highest");
  });

  // It was a text-colour change only, so the active field was signalled by a
  // tint rather than the filled container the token describes.
  test("TimeSelectorSelectedContainerColor is PrimaryContainer", () => {
    expect(css).toContain("primary-container");
  });

  test("no selected state is drawn as a 10% primary tint", () => {
    expect(css).not.toMatch(/rgba\(var\(--mtrl-sys-color-primary-rgb[^)]*\),\s*0\.1\)/);
  });
});

describe("clock dial colour roles, which are drawn rather than styled", () => {
  test("ClockDialColor is SurfaceContainerHighest", () => {
    expect(dial).toContain("sys-color-surface-container-highest");
  });

  test("ClockDialSelectorHandleContainerColor is Primary, a solid disc", () => {
    expect(dial).toContain("const selectedBgColor = primaryColor");
  });

  // The defect behind the token: a selected number was drawn primary on a 10%
  // primary disc — the same hue as its own background.
  test("ClockDialSelectedLabelTextColor is OnPrimary", () => {
    expect(dial).toContain("isSelected ? colors.onPrimaryColor : colors.onSurfaceColor");
    expect(dial).not.toContain("isSelected ? colors.primaryColor : colors.onSurfaceColor");
  });

  test("the selected disc is no longer a 10% wash", () => {
    expect(dial).not.toMatch(/selectedBgColor = `rgba\(\$\{primaryRgb\}, 0\.1\)`/);
  });

  // The centre knob always did this correctly; the rings now agree with it.
  test("the knob and the rings use the same pair", () => {
    expect(dial).toContain("colors.onPrimaryColor");
    expect(dial).toContain("ctx.fillStyle = colors.primaryColor");
  });
});
