#!/usr/bin/env bun

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface AnyTypeError {
  file: string;
  line: number;
  column: number;
  context: string;
  pattern: string;
}

// Get ESLint output
console.log("🔍 Analyzing any type usage...\n");

try {
  const eslintOutput = execSync(
    "bunx eslint src --ext .ts,.tsx --format json",
    { encoding: "utf-8", maxBuffer: 1024 * 1024 * 10 }
  );

  const results = JSON.parse(eslintOutput);
  const anyErrors: AnyTypeError[] = [];

  // Extract any type errors
  results.forEach((fileResult: any) => {
    fileResult.messages
      .filter((msg: any) => msg.ruleId === "@typescript-eslint/no-explicit-any")
      .forEach((msg: any) => {
        const filePath = fileResult.filePath;
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split("\n");
        const errorLine = lines[msg.line - 1] || "";

        // Categorize the pattern
        let pattern = "other";
        if (errorLine.includes(": any")) pattern = "type-annotation";
        else if (errorLine.includes("<any>")) pattern = "type-assertion";
        else if (errorLine.includes("= any")) pattern = "type-parameter";
        else if (errorLine.includes("Record<string, any>"))
          pattern = "record-type";
        else if (errorLine.includes("): any")) pattern = "return-type";
        else if (errorLine.includes("any[]")) pattern = "array-type";
        else if (errorLine.includes("(any)")) pattern = "cast";

        anyErrors.push({
          file: path.relative(process.cwd(), filePath),
          line: msg.line,
          column: msg.column,
          context: errorLine.trim(),
          pattern,
        });
      });
  });

  // Group by pattern
  const byPattern = anyErrors.reduce((acc, err) => {
    if (!acc[err.pattern]) acc[err.pattern] = [];
    acc[err.pattern].push(err);
    return acc;
  }, {} as Record<string, AnyTypeError[]>);

  // Group by file
  const byFile = anyErrors.reduce((acc, err) => {
    if (!acc[err.file]) acc[err.file] = 0;
    acc[err.file]++;
    return acc;
  }, {} as Record<string, number>);

  // Print summary
  console.log(`📊 Total any type errors: ${anyErrors.length}\n`);

  console.log("📁 Top 10 files with most errors:");
  Object.entries(byFile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([file, count]) => {
      console.log(`  ${count.toString().padStart(3)} ${file}`);
    });

  console.log("\n🎯 Error patterns:");
  Object.entries(byPattern)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([pattern, errors]) => {
      console.log(`\n  ${pattern}: ${errors.length} occurrences`);
      // Show a few examples
      errors.slice(0, 3).forEach((err) => {
        console.log(
          `    ${err.file}:${err.line} - ${err.context.slice(0, 60)}...`
        );
      });
    });

  // Generate fix suggestions
  console.log("\n💡 Suggested fixes:\n");
  console.log("1. Create common type aliases in src/types/common.ts:");
  console.log(`   export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
   export type JSONObject = { [key: string]: JSONValue };
   export type JSONArray = JSONValue[];
   export type UnknownObject = Record<string, unknown>;
   export type AnyFunction = (...args: unknown[]) => unknown;\n`);

  console.log("2. Replace common patterns:");
  console.log("   - Record<string, any> → Record<string, unknown>");
  console.log("   - (param: any) → (param: unknown)");
  console.log("   - : any[] → : unknown[]");
  console.log("   - <T = any> → <T = unknown>\n");

  console.log("3. For API responses, create specific types or use a generic:");
  console.log(
    "   type APIResponse<T = unknown> = { data: T; meta?: ResponseMeta };"
  );
} catch (error) {
  console.error("Error running analysis:", error);
}
