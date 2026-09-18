# AGENTS.md — working on mtrl

For any coding agent. [CLAUDE.md](./CLAUDE.md) is the long form — architecture, coding
standards, SCSS rules; this page is the short one, and where the two differ about *process*,
this page describes how work happens under the agent manifest (`.agents/agents.yaml`).

## The shape in one paragraph

A Material Design 3 component library in TypeScript, zero dependencies, functional composition:
a component is built with `pipe(createBase, withElement(...), withX(...), withLifecycle())`
from features in `src/core/` and its own folder under `src/components/<name>/`
(`<name>.ts`, `config.ts`, `types.ts`, `api.ts`, `features.ts` or `features/`, `constants.ts`). Styles are SCSS
under `src/styles/`, one file per component, tokens first. Every component's behaviour and
measures come from the M3 specification, not from taste.

## Rules that bite

- **Spec-driven.** A visual or behavioural change names its source in the commit body, in this
  order of trust: the Compose Material 3 token files (`androidx/androidx`,
  `compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/*Tokens.kt`),
  then the `material-components-android` docs, then m3.material.io.
- **A patch does not change a contract.** Anything that changes what an existing call does, or
  what a type accepts, belongs to the next major: say so in the pull request and stop, rather
  than slipping it into a fix.
- **Tests run against the real component in a real DOM** (`test/components/<name>/`,
  `test/setup.ts`). No mocks of the component defined inside the test file — that is how the
  old suite passed while asserting nothing. `bun run test:naming` and `bun run test:types`
  check the suite's own shape.
- **Accessibility is behaviour.** Roles, names, `aria-*` relationships and keyboard paths are
  tested like any other behaviour; an id referenced by `aria-controls` or `aria-labelledby`
  must exist and be unique on a page with two instances.
- **No `innerHTML` writes** outside the one sink (`setHTML`); no `any` in new code; new files
  pass `bun run strict:check`.
- **Class names** go through the prefix helpers; never hard-code `mtrl-`.

## Commands

```bash
bun test test/components/tabs/                    # one component — use this while iterating
bun run ts:check                                  # types
bun run lint
npx sass --load-path=src/styles src/styles/main.scss > /dev/null   # the stylesheet compiles
bun run build && bun run size:check && bun run consumer:check
```

The full gate is the CI's steps — types, lint, test naming and types, the suite, build, tooling
type check, package size, consumer check, and the Playwright checks for slider, drawer and
navigation rail — run on a clean export of your commit. Run what your change touches.

## Do not touch

`package.json`, `bun.lock`, `.gitignore`, `.npmrc`, `.github/workflows/*`. No new dependencies.
Do not commit, push or open a pull request yourself: the engine verifies the working tree and
publishes it. Do not create new markdown files unless the task asks for one.

## When the task and the code disagree

Say so in the pull request. If the finding you were given is already fixed, or the fix it
proposes would break a consumer (`mtrl-addons` builds on `list`), that sentence is the most
useful thing you can write.
