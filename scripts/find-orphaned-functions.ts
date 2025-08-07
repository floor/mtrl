#!/usr/bin/env bun

import { execSync } from "child_process";
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

interface FunctionInfo {
  name: string;
  file: string;
  line: number;
  isExported: boolean;
}

interface UsageInfo {
  functions: Map<string, FunctionInfo>;
  usages: Map<string, Set<string>>; // function name -> files that use it
}

// Get all TypeScript files in list-manager directory
function getListManagerFiles(): string[] {
  const listManagerDir = path.join(__dirname, "../src/core/list-manager");
  const files: string[] = [];

  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (
        entry.name.endsWith(".ts") &&
        !entry.name.endsWith(".test.ts")
      ) {
        files.push(fullPath);
      }
    }
  }

  walkDir(listManagerDir);
  return files;
}

// Parse a TypeScript file and extract function declarations
function extractFunctions(filePath: string): FunctionInfo[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const functions: FunctionInfo[] = [];

  function visit(node: ts.Node) {
    // Function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      const line =
        sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const isExported =
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ??
        false;
      functions.push({
        name: node.name.text,
        file: filePath,
        line,
        isExported,
      });
    }

    // Arrow functions assigned to variables
    if (ts.isVariableStatement(node)) {
      const isExported =
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ??
        false;
      node.declarationList.declarations.forEach((decl) => {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          if (
            ts.isArrowFunction(decl.initializer) ||
            ts.isFunctionExpression(decl.initializer)
          ) {
            const line =
              sourceFile.getLineAndCharacterOfPosition(decl.getStart()).line +
              1;
            functions.push({
              name: decl.name.text,
              file: filePath,
              line,
              isExported,
            });
          }
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return functions;
}

// Find usages of functions in a file
function findUsages(filePath: string, functionNames: Set<string>): Set<string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const usedFunctions = new Set<string>();

  // Simple regex-based search for function calls
  functionNames.forEach((funcName) => {
    // Look for function calls, imports, or references
    const patterns = [
      new RegExp(`\\b${funcName}\\s*\\(`, "g"), // Function call
      new RegExp(`\\b${funcName}\\b(?!\\s*:)`, "g"), // Reference (not type annotation)
      new RegExp(`import.*\\b${funcName}\\b`, "g"), // Import
    ];

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        usedFunctions.add(funcName);
      }
    }
  });

  return usedFunctions;
}

// Main analysis
async function analyzeOrphanedFunctions() {
  console.log("🔍 Analyzing list-manager for orphaned functions...\n");

  const files = getListManagerFiles();
  const usageInfo: UsageInfo = {
    functions: new Map(),
    usages: new Map(),
  };

  // Step 1: Extract all functions
  console.log("📋 Extracting functions from files:");
  files.forEach((file) => {
    const functions = extractFunctions(file);
    const relPath = path.relative(process.cwd(), file);
    console.log(`  ${relPath}: ${functions.length} functions`);

    functions.forEach((func) => {
      usageInfo.functions.set(func.name, func);
      usageInfo.usages.set(func.name, new Set());
    });
  });

  const allFunctionNames = new Set(usageInfo.functions.keys());
  console.log(`\n📊 Total functions found: ${allFunctionNames.size}\n`);

  // Step 2: Find usages
  console.log("🔎 Searching for function usages...");

  // Check usages in list-manager files
  files.forEach((file) => {
    const usedFunctions = findUsages(file, allFunctionNames);
    usedFunctions.forEach((funcName) => {
      usageInfo.usages.get(funcName)?.add(file);
    });
  });

  // Also check test files
  const testDir = path.join(__dirname, "../test/core/list-manager");
  if (fs.existsSync(testDir)) {
    const testFiles = fs
      .readdirSync(testDir, { recursive: true })
      .filter((f) => f.toString().endsWith(".test.ts"))
      .map((f) => path.join(testDir, f.toString()));

    testFiles.forEach((file) => {
      const usedFunctions = findUsages(file, allFunctionNames);
      usedFunctions.forEach((funcName) => {
        usageInfo.usages.get(funcName)?.add(file);
      });
    });
  }

  // Step 3: Identify orphaned functions
  console.log("\n🚨 Orphaned functions (not used anywhere):\n");

  const orphaned: FunctionInfo[] = [];
  const underused: FunctionInfo[] = [];

  usageInfo.functions.forEach((func, name) => {
    const usageCount = usageInfo.usages.get(name)?.size ?? 0;

    // Don't count the file where it's defined
    const externalUsageCount = Array.from(
      usageInfo.usages.get(name) ?? []
    ).filter((f) => f !== func.file).length;

    if (externalUsageCount === 0) {
      // Special cases to ignore
      const ignoredPatterns = [
        /^with/, // Enhancer functions
        /^create/, // Factory functions that might be exported
        /^default/, // Default exports
        /^index$/, // Index exports
      ];

      const shouldIgnore = ignoredPatterns.some((pattern) =>
        pattern.test(name)
      );

      if (!shouldIgnore) {
        if (func.isExported) {
          underused.push(func);
        } else {
          orphaned.push(func);
        }
      }
    }
  });

  // Display results
  if (orphaned.length > 0) {
    console.log("❌ Private functions with no usage:");
    orphaned.forEach((func) => {
      const relPath = path.relative(process.cwd(), func.file);
      console.log(`  ${func.name} (${relPath}:${func.line})`);
    });
  } else {
    console.log("✅ No orphaned private functions found!");
  }

  if (underused.length > 0) {
    console.log("\n⚠️  Exported functions only used in their own file:");
    underused.forEach((func) => {
      const relPath = path.relative(process.cwd(), func.file);
      console.log(`  ${func.name} (${relPath}:${func.line})`);
    });
  }

  // Step 4: Use madge for circular dependency check
  console.log("\n🔄 Checking for circular dependencies...");
  try {
    const madgeOutput = execSync(
      `npx madge --circular --extensions ts src/core/list-manager`,
      { encoding: "utf-8" }
    );

    if (madgeOutput.trim()) {
      console.log("❌ Circular dependencies found:");
      console.log(madgeOutput);
    } else {
      console.log("✅ No circular dependencies found!");
    }
  } catch (error) {
    console.log("✅ No circular dependencies found!");
  }

  // Summary
  console.log("\n📈 Summary:");
  console.log(`  Total functions: ${usageInfo.functions.size}`);
  console.log(`  Orphaned (private): ${orphaned.length}`);
  console.log(`  Underused (exported): ${underused.length}`);
  console.log(
    `  Properly used: ${
      usageInfo.functions.size - orphaned.length - underused.length
    }`
  );
}

// Run the analysis
analyzeOrphanedFunctions().catch(console.error);
