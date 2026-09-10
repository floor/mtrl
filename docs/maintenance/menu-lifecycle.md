# Menu lifecycle fix and consumer handoff

This patch is based on mtrl 0.8.0-next.35 and is independent of package-size optimization. DatePicker is unchanged.

The menu previously created its lifecycle after its features, so conditional feature cleanup never registered. Keyboard navigation and opener tracking also installed anonymous document keydown listeners. The fix initializes the lifecycle before those features, removes named listeners during destruction, and cancels all feature-owned timers and animation frames, including Tab detection and typeahead. It also releases the open-menu registry, keyboard handlers, and submenu elements that are already fading out. Closing the last submenu now removes its global listeners immediately.

Validation:

- `bun run ts:check` and `bun run build`.
- `bun test`: existing behavior plus six lifecycle regressions. The first five regressions were also run against the unchanged next.35 source and all failed there.
- Regression scenarios include destruction before initialization, opening and closing phases across 40 mounts, Tab detection, typeahead, opener blur and ArrowUp, hover intent, focus restoration, and opening/fading submenus.
- The web application's `scripts/check-architecture-browser.ts` and `test/browser/architecture.fixture.ts` were run with a temporary Bun resolver mapping every bare `mtrl` import to this worktree's freshly built ESM bundle. No installed dependency files were edited for this validation.
- After 40 actual application mounts, instrumentation found zero remaining document keydown listeners. However, the overall architecture heap assertion still failed: approximately 12,066 → 16,110 → 20,093 → 24,056 KiB. DOM counts remained stable and no page errors were reported. This confirms listener cleanup, not resolution of all application retention.

Release handoff:

1. Review and release this fix independently from size changes; the source package version remains next.35 until a release version is assigned.
2. The web session should update its manifest and lockfile to the released version (or install the supplied local package for pre-release validation), removing any diagnostic installed-file edits or incomplete patch references.
3. Rerun the original architecture harness without a resolution override, then investigate the remaining heap retention separately. The local installed-file diagnostics are not a reproducible upstream dependency fix.
