import { expect, test } from 'bun:test';
import { compileString } from 'sass';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const properties = (css: string) => {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...new Set([
    ...Array.from(text.matchAll(/(?<![\w-])(--[\w-]+)\s*:/g), m => m[1]),
    ...Array.from(text.matchAll(/var\(\s*(--[\w-]+)/g), m => m[1]),
  ])];
};

for (const prefix of ['mtrl', 'custom']) {
  test(`compiled custom properties use the ${prefix} prefix for declarations and reads`, () => {
    // The prefix is a source variable, not a configurable Sass !default.
    // Exercise its one-variable switch in a disposable stylesheet copy.
    const directory = mkdtempSync(join(tmpdir(), 'mtrl-property-prefix-'));
    let css: string;
    try {
      const styles = join(directory, 'styles');
      cpSync('src/styles', styles, { recursive: true });
      const base = join(styles, 'abstract/_base.scss');
      writeFileSync(base, readFileSync(base, 'utf8').replace(/\$prefix:\s*'[^']+'/, `$prefix: '${prefix}'`));
      css = compileString("@use 'main';", { loadPaths: [styles] }).css;
    } finally { rmSync(directory, { recursive: true, force: true }); }
    const names = properties(css);
    expect(names.length).toBeGreaterThan(100);
    expect(css).toContain(`outline: 2px solid var(--${prefix}-sys-color-primary)`);
    expect(names).not.toContain(`--${prefix}-primary-color`);
    expect(names.filter(name => !name.startsWith(`--${prefix}-`))).toEqual([]);
    for (const name of ['button-group-height', 'drawer-width', 'card-elevation', 'extended-fab-height', 'segmented-button-height', 'chip-checkmark-color', 'list-item-offset', 'carousel-corner', 'slider-color']) {
      expect(names).toContain(`--${prefix}-${name}`);
    }
  });
}

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = join(directory, entry.name);
  return entry.isDirectory() ? sourceFiles(file) : /\.[jt]sx?$/.test(entry.name) ? [file] : [];
});

test('source custom property literals derive their names from the configured prefix', () => {
  const failures: string[] = [];
  for (const file of sourceFiles('src')) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const report = (node: ts.Node) => failures.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${node.getText(source)}`);
    const visit = (node: ts.Node) => {
      if (ts.isStringLiteralLike(node) && node.text.startsWith('--')) {
        // BEM suffixes passed to the class-name helper are not CSS properties.
        const parent = node.parent;
        const classSuffix = ts.isCallExpression(parent) && ts.isIdentifier(parent.expression) && parent.expression.text === 'cls';
        if (!classSuffix) report(node);
      }
      if (ts.isTemplateExpression(node) && node.head.text.startsWith('--')) {
        // `className += --${modifier}` appends a BEM modifier, not a property.
        const parent = node.parent;
        const classSuffix = ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken && parent.left.getText(source) === 'className';
        if (!classSuffix) {
          const first = node.templateSpans[0];
          const expression = first.expression.getText(source);
          if (node.head.text !== '--' || !/(?:^|\.)(?:prefix|PREFIX)$/.test(expression) || !first.literal.text.startsWith('-')) report(node);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  expect(failures).toEqual([]);
});
