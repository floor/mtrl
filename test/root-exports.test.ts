// test/root-exports.test.ts
//
// FLO-351: every root export is public API. The list is pinned, so a name added
// to or dropped from `mtrl` fails here until the fixture is regenerated
// (`bun run root-exports:update`) and the diff reviewed. The names leaving the
// root in `material` 3.0.0 carry @deprecated on their root re-export only: an editor flags
// them imported from `mtrl`, never from the subpath they move to.
import { describe, expect, test } from "bun:test";
import ts from "typescript";
import { join } from "node:path";
import { diffRootExports, migrationTable, readPinned, readRootExports, type RootExport } from "../scripts/root-exports";

const ROOT = join(import.meta.dir, "..");
const now = readRootExports();

describe("the root exports (FLO-351)", () => {
  test("match the pinned list: an added or removed name fails until the fixture is regenerated", async () => {
    const changes = diffRootExports(await readPinned(), now);
    expect(changes, `Run \`bun run root-exports:update\` if intended:\n${changes.join("\n")}`).toEqual([]);
  });

  test("the migration table is the one the list generates", async () => {
    expect(await Bun.file(join(ROOT, "scripts/fixtures/root-exports.md")).text()).toBe(migrationTable(now));
  });

  test("the root keeps the components and the app-level helpers; the composition core is leaving", () => {
    const status = new Map(now.map((e) => [e.name, e]));
    for (const name of ["createButton", "createTextField", "clearSnackbars", "configureHTML", "schemeToTokens", "THEME_ROLES", "setComponentDefaults", "ComponentConfigMap"]) {
      expect(status.get(name)?.status).toBe("public");
    }
    for (const [name, path] of [["pipe", "mtrl/core/compose"], ["createBase", "mtrl/core/compose"], ["throttle", "mtrl/core/utils"],
      ["loggingMiddleware", "mtrl/core/state"], ["CleanupManager", "mtrl/core/canvas"], ["addClass", "mtrl/core/dom"]]) {
      expect(status.get(name)).toMatchObject({ status: "deprecated", path });
    }
  });

  test("the canonical names are public; the old ones are renamed to them (FLO-383)", () => {
    const status = new Map(now.map((e) => [e.name, e]));
    const renames = [["createTextfield", "createTextField"], ["TextfieldConfig", "TextFieldConfig"],
      ["TextfieldComponent", "TextFieldComponent"], ["CardSchema", "CardConfig"],
      ["TopAppBar", "TopAppBarComponent"], ["BottomAppBar", "BottomAppBarComponent"]];
    for (const [old, to] of renames) {
      expect(status.get(to!)?.status).toBe("public");
      expect(status.get(old!)).toMatchObject({ status: "renamed", to });
    }
    expect(now.filter((e) => e.status === "renamed").map((e) => e.name).sort()).toEqual(renames.map(([old]) => old!).sort());
  });
});

describe("deprecation is on the root re-export only (FLO-351)", () => {
  const CONSUMER = join(ROOT, "test/__root-exports-consumer.ts");
  const fromRoot = "../src/index";
  const fromPath = (path: string) => (path === "mtrl/core" ? "../src/core/index" : `../src/core/${path.slice("mtrl/core/".length)}/index`);

  const importsOf = (entries: RootExport[], from: (e: RootExport) => string): string => {
    const byModule = new Map<string, RootExport[]>();
    for (const e of entries) byModule.set(from(e), [...(byModule.get(from(e)) ?? []), e]);
    return [...byModule].map(([module, es], i) => {
      const values = es.filter((e) => e.kind !== "type").map((e) => `${e.name} as v${i}_${e.name}`);
      const types = es.filter((e) => e.kind === "type").map((e) => `${e.name} as t${i}_${e.name}`);
      return [
        values.length ? `import { ${values.join(", ")} } from "${module}";` : "",
        types.length ? `import type { ${types.join(", ")} } from "${module}";` : "",
      ].join("\n");
    }).join("\n");
  };

  /** The deprecated names the language service reports in the consumer, and its errors */
  const analyse = (source: string) => {
    const options: ts.CompilerOptions = {
      strict: true, skipLibCheck: true, noEmit: true, noUnusedLocals: false,
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
    const flagged = new Set(service.getSuggestionDiagnostics(CONSUMER).filter((d) => d.code === 6385 || d.code === 6387)
      // An aliased specifier's span is `name as alias`
      .map((d) => source.slice(d.start!, d.start! + d.length!).split(" as ")[0]!));
    const errors = service.getSemanticDiagnostics(CONSUMER).map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "));
    return { flagged, errors };
  };

  const deprecated = now.filter((e) => e.status === "deprecated");
  const KEPT_CORE = new Set(["configureHTML", "schemeToTokens", "THEME_ROLES", "setComponentDefaults", "getComponentDefaults",
    "setGlobalDefaults", "clearGlobalDefaults", "HTMLPolicy", "HTMLInput", "TrustedHTMLLike", "ThemeRole", "SchemeRoles",
    "SchemeToTokensOptions", "ThemeTokens", "ComponentConfigMap"]);
  const kept = now.filter((e) => e.status === "public");
  // A class is a value and a type: `new`, `instanceof` and the type position all keep working.
  const classUse = (module: string) => `import { CleanupManager } from "${module}";
const manager: CleanupManager = new CleanupManager();
export const isManager = manager instanceof CleanupManager;`;

  test("imported from mtrl, every leaving name is flagged, a class in every position, and no kept name is", () => {
    const { flagged, errors } = analyse(`${importsOf(now, () => fromRoot)}\n${classUse(fromRoot)}`);
    expect(errors).toEqual([]);
    expect(deprecated.filter((e) => !flagged.has(e.name)).map((e) => e.name)).toEqual([]);
    // FLO-383: a renamed name is flagged too, and its new name is not
    expect(now.filter((e) => e.status === "renamed" && !flagged.has(e.name)).map((e) => e.name)).toEqual([]);
    expect(now.filter((e) => e.status === "renamed" && flagged.has(e.to!)).map((e) => e.to)).toEqual([]);
    // A kept name may be deprecated at its own declaration (the segmented button is); the root adds none
    const own = analyse(importsOf(kept, (e) => (KEPT_CORE.has(e.name) ? "../src/core/index" : "../src/components/index")));
    expect(own.errors).toEqual([]);
    expect(kept.filter((e) => flagged.has(e.name)).map((e) => e.name)).toEqual(kept.filter((e) => own.flagged.has(e.name)).map((e) => e.name));
    expect(flagged.has("CleanupManager")).toBe(true);
  }, 60_000);

  test("imported from their new path, no leaving name is flagged", () => {
    const { flagged, errors } = analyse(`${importsOf(deprecated, (e) => fromPath(e.path!))}\n${classUse(fromPath("mtrl/core/canvas"))}`);
    expect(errors).toEqual([]);
    expect([...flagged]).toEqual([]);
  }, 60_000);
});
