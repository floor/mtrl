# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands
- Build: `bun run build`
- Dev server: `bun run dev`
- Tests: `bun test`
- Single test: `bun test test/components/button.test.ts`
- Watch tests: `bun test --watch`
- Test with UI: `bun test --watch --ui`
- Test coverage: `bun test --coverage`
- Docs: `bun run docs` (uses TypeDoc)

## Code Conventions
- Factory pattern: Use `createComponent` naming for component creators
- Functional composition with pipe pattern
- Follow BEM-style CSS naming: `mtrl-component__element--modifier`
- Use TypeDoc-compatible comments for documentation
- Use TypeScript with strict typing where possible
- Error handling: Try/catch blocks for component creation
- Import order: core modules first, then utility functions, local imports last
- Components follow a standard structure in their directories (api.ts, config.ts, etc.)
- Use ES6+ features with full browser compatibility

## Test Conventions
- Tests live in `test/components/` with `.test.ts` extension
- Use JSDOM for DOM manipulation in tests
- Create mock implementations to avoid circular dependencies
- Test structure follows `describe/test` pattern
- Test component creation, options, events, and state changes
- Use `import type` to avoid circular dependencies in TypeScript tests
- Test directory structure mirrors src directory structure