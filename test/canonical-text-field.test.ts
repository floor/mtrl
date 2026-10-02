// test/canonical-text-field.test.ts
//
// FLO-383 A2: "two words everywhere in the API". Each entry exports the text
// field under its canonical name, the same binding as the old spelling, and the
// old spelling is flagged where it is imported (deprecated until `material` 3.0.0). Tags,
// element names, CSS classes, folders and event strings keep "textfield".
// Svelte's index is written by the build; svelte:check covers it. Nothing here
// imports the adapters at run time: they load mtrl/elements/css/* through the
// package's own exports, which need a build, and bun test runs without one.
import { describe, expect, test } from "bun:test";
import ts from "typescript";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

const RENAMES: Array<[entry: string, old: string, to: string]> = [
  ["../src/elements/index", "defineTextfield", "defineTextField"],
  ["../src/elements/index", "TextfieldSpec", "TextFieldSpec"],
  ["../src/elements/index", "TextfieldElement", "TextFieldElement"],
  ["../src/elements/index", "TextfieldElementComponent", "TextFieldElementComponent"],
  ["../src/react/index", "Textfield", "TextField"],
  ["../src/solid/index", "Textfield", "TextField"],
  ["../src/vue/index", "MTextfield", "MTextField"],
  ["../src/components/textfield/index", "TextfieldDensity", "TextFieldDensity"],
  ["../src/components/textfield/index", "TextfieldEvents", "TextFieldEvents"],
  ["../src/components/textfield/index", "TextfieldValuePayload", "TextFieldValuePayload"],
  ["../src/components/textfield/index", "TextfieldFocusPayload", "TextFieldFocusPayload"],
  ["../src/components/textfield/index", "TextfieldTrailingPayload", "TextFieldTrailingPayload"],
  ["../src/elements/index", "textfieldElement", "textFieldElement"],
  ["../src/components/textfield/constants", "TEXTFIELD_VARIANTS", "TEXT_FIELD_VARIANTS"],
  ["../src/components/textfield/constants", "TEXTFIELD_STATES", "TEXT_FIELD_STATES"],
  ["../src/components/textfield/constants", "TEXTFIELD_TYPES", "TEXT_FIELD_TYPES"],
  ["../src/components/textfield/constants", "TEXTFIELD_EVENTS", "TEXT_FIELD_EVENTS"],
  ["../src/components/textfield/constants", "TEXTFIELD_DENSITY", "TEXT_FIELD_DENSITY"],
  ["../src/components/textfield/constants", "TEXTFIELD_DEFAULTS", "TEXT_FIELD_DEFAULTS"],
  ["../src/components/textfield/constants", "TEXTFIELD_CLASSES", "TEXT_FIELD_CLASSES"],
];

describe("the text field's canonical names (FLO-383)", () => {
  test("imported from its entry, each old name is the same export as its new name, flagged where the new one is not", () => {
    const CONSUMER = join(ROOT, "test/__canonical-text-field-consumer.ts");
    const imports = RENAMES.map(([entry, old, to], i) => `import { ${old} as old${i}, ${to} as new${i} } from "${entry}";`);
    // Equal types: the type names (values are compared at run time above)
    const checks = RENAMES.flatMap(([, old], i) =>
      /^Textfield(Spec|Element|ElementComponent|Density|Events|ValuePayload|FocusPayload|TrailingPayload)$/.test(old) ? [`export const same${i}: Equals<old${i}, new${i}> = true;`] : []);
    const source = [
      ...imports,
      "type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;",
      ...checks,
    ].join("\n");
    const options: ts.CompilerOptions = {
      strict: true, skipLibCheck: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    };
    const host: ts.LanguageServiceHost = {
      getScriptFileNames: () => [CONSUMER],
      getScriptVersion: () => "1",
      getScriptSnapshot: (file) => file === CONSUMER ? ts.ScriptSnapshot.fromString(source)
        : ts.sys.fileExists(file) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(file)!) : undefined,
      getCurrentDirectory: () => ROOT,
      getCompilationSettings: () => options,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
      fileExists: (file) => file === CONSUMER || ts.sys.fileExists(file),
      readFile: (file) => file === CONSUMER ? source : ts.sys.readFile(file),
    };
    const service = ts.createLanguageService(host);
    const errors = service.getSemanticDiagnostics(CONSUMER).map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "));
    expect(errors).toEqual([]);
    // The same export, value or type: both local names resolve to one symbol
    const program = service.getProgram()!;
    const checker = program.getTypeChecker();
    const file = program.getSourceFile(CONSUMER)!;
    const target = (local: string): ts.Symbol | undefined => {
      const symbol = checker.getSymbolsInScope(file, ts.SymbolFlags.Alias).find((s) => s.name === local);
      return symbol && checker.getAliasedSymbol(symbol);
    };
    expect(RENAMES.flatMap(([, old, to], i) => (target(`old${i}`) && target(`old${i}`) === target(`new${i}`) ? [] : [`${old}/${to}`]))).toEqual([]);
    // Each flag by its import line, so one entry's lost tag is not hidden by another
    // entry's same-named export (React's and Solid's Textfield)
    const flagged = service.getSuggestionDiagnostics(CONSUMER)
      .filter((d) => d.code === 6385 || d.code === 6387)
      .map((d) => `${source.slice(0, d.start!).split("\n").length - 1}:${source.slice(d.start!, d.start! + d.length!).split(" as ")[0]!}`);
    expect(RENAMES.filter(([, old], i) => !flagged.includes(`${i}:${old}`)).map(([entry, old]) => `${entry} ${old}`)).toEqual([]);
    expect(RENAMES.filter(([, , to], i) => flagged.includes(`${i}:${to}`)).map(([entry, , to]) => `${entry} ${to}`)).toEqual([]);
  }, 60_000);
});
