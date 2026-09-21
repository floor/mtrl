// Development-only warnings.
//
// FLO-106. The rule for selection components is that a value no option
// carries clears the selection, the same as native `<select>` setting
// `selectedIndex = -1`. Clearing silently is indistinguishable from a typo,
// so it warns -- but only where a warning helps, which is not production.
//
// The guard is written defensively rather than as a bare
// `process.env.NODE_ENV`. The CommonJS bundle has that expression replaced at
// build time (`build.ts`), but the ESM modules are emitted by tsc, which
// substitutes nothing. A consumer loading those modules straight into a
// browser has no `process`, and a bare read would throw where the library is
// only trying to warn. The cost of `typeof process` is that raw-browser ESM
// gets no warning; throwing instead would be worse.

const isDevelopment = (): boolean => {
  try {
    return (
      typeof process !== "undefined" &&
      process.env != null &&
      process.env.NODE_ENV !== "production"
    );
  } catch {
    return false;
  }
};

/**
 * Warns that a value matched no option, once per call.
 *
 * @param component - the component name, as it appears to a consumer
 * @param value - the value that matched nothing
 * @internal
 */
export const warnUnknownValue = (component: string, value: unknown): void => {
  if (!isDevelopment()) return;
  console.warn(`[mtrl] ${component}: no option with value "${String(value)}"`);
};
