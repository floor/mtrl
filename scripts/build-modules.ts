import ts from "typescript";
import { dirname, join, relative, resolve } from "node:path";

/** Emit the original module graph so consumers can tree-shake and code-split it. */
export function buildModules(outdir: string) {
  const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd(), {
    rootDir: resolve("src"),
    outDir: resolve(outdir),
    noEmit: false,
    noEmitOnError: true,
    declaration: true,
    sourceMap: false,
    declarationMap: false,
    // Preserve declaration documentation; JS comments are removed below.
    removeComments: false,
  });
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
  if (diagnostics.length) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => "\n",
    }));
  }

  const result = program.emit(undefined, (filename, text) => {
    // Node and browsers require explicit extensions and directory index paths.
    // Rewrite only module specifiers, including dynamic and declaration imports.
    const sourceName = join(resolve("src"), relative(resolve(outdir), filename))
      .replace(/\.js$|\.d\.ts$/, ".ts");
    const file = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
    const edits: { start: number; end: number; value: string }[] = [];
    function visit(node: ts.Node) {
      if (ts.isStringLiteral(node) && node.text.startsWith(".")) {
        const parent = node.parent;
        const isModule =
          ((ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) && parent.moduleSpecifier === node) ||
          (ts.isCallExpression(parent) && parent.expression.kind === ts.SyntaxKind.ImportKeyword && parent.arguments[0] === node) ||
          (ts.isLiteralTypeNode(parent) && ts.isImportTypeNode(parent.parent));
        if (isModule) {
          const module = ts.resolveModuleName(node.text, sourceName, parsed.options, ts.sys).resolvedModule;
          if (!module) throw new Error(`Cannot resolve ${node.text} from ${sourceName}`);
          let specifier = relative(dirname(sourceName), module.resolvedFileName)
            .replace(/\\/g, "/").replace(/(?:\.d)?\.tsx?$/, ".js");
          if (!specifier.startsWith(".")) specifier = `./${specifier}`;
          edits.push({ start: node.getStart(file), end: node.getEnd(), value: JSON.stringify(specifier) });
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(file);
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      text = text.slice(0, edit.start) + edit.value + text.slice(edit.end);
    }
    if (filename.endsWith(".js")) {
      // Avoid shipping API prose twice while keeping ESM readable for debugging.
      text = ts.createPrinter({ removeComments: true }).printFile(
        ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true),
      );
    }
    ts.sys.writeFile(filename, text);
  });
  if (result.emitSkipped || result.diagnostics.length) throw new Error("Module emission failed");
}
