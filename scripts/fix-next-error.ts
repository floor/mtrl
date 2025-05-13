#!/usr/bin/env bun
/**
 * fix-next-error.ts
 * Finds the next TypeScript error and provides options to fix it
 */

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { argv } from 'process';

// Configuration
const FOCUS_FILE = argv[2]; // Optional file path from command line

// Regular expression to extract file paths and error information
const FILE_ERROR_REGEX = /^([^(]+)\((\d+),(\d+)\): error TS(\d+): (.+)$/;

// Error tracking
interface TypeScriptError {
  filePath: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

// Run TypeScript compiler to check for errors
async function runTsc(filePath?: string): Promise<string> {
  return new Promise((resolve) => {
    const args = ['tsc', '--noEmit', '--skipLibCheck'];
    if (filePath) {
      args.push(filePath);
    }
    
    console.log(`Running TypeScript check${filePath ? ` on ${filePath}` : ''}...`);
    
    const output: Buffer[] = [];
    const childProcess = spawn('npx', args);

    childProcess.stdout.on('data', (data) => {
      output.push(data);
    });

    childProcess.stderr.on('data', (data) => {
      output.push(data);
    });

    childProcess.on('close', () => {
      const outputStr = Buffer.concat(output).toString('utf-8');
      resolve(outputStr);
    });
  });
}

// Parse TypeScript errors from compiler output
function parseErrors(output: string): TypeScriptError[] {
  const errors: TypeScriptError[] = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const match = line.match(FILE_ERROR_REGEX);
    if (match) {
      errors.push({
        filePath: match[1].trim(),
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        code: match[4],
        message: match[5].trim()
      });
    }
  }
  
  return errors;
}

// Skip test files if working on component files
function shouldSkipFile(filePath: string): boolean {
  // Skip test files 
  if (filePath.startsWith('test/')) {
    return true;
  }
  
  return false;
}

// Show the context of the error
function showErrorContext(filePath: string, line: number): void {
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Get 3 lines before and after for context (or fewer if at file boundaries)
    const startLine = Math.max(0, line - 4);
    const endLine = Math.min(lines.length - 1, line + 2);
    
    console.log('\nError context:');
    console.log('---------------------------------------------');
    
    for (let i = startLine; i <= endLine; i++) {
      const lineNum = i + 1;
      const prefix = lineNum === line ? '> ' : '  ';
      console.log(`${prefix}${lineNum}: ${lines[i]}`);
    }
    
    console.log('---------------------------------------------');
  } catch (err) {
    console.log(`Could not read file: ${filePath}`);
  }
}

// Suggest fixes based on error type
function suggestFix(error: TypeScriptError): string {
  switch (error.code) {
    case '2345': // Argument type not assignable
    case '2322': // Type not assignable
      // Check for common patterns in the error message
      if (error.message.includes('is not assignable to')) {
        return `Try adding a type assertion with 'as' for the problematic expression`;
      }
      break;
      
    case '2304': // Cannot find name
      return `Check for missing imports or typos`;
      
    case '2551': // Property does not exist
      return `Check for typos or missing property definitions`;
      
    case '2339': // Property does not exist on type
      return `Check for typos or add proper type definitions`;
      
    case '7006': // Parameter implicitly has an 'any' type
      return `Add explicit type annotations to parameters`;
  }
  
  return 'No automatic suggestion available for this error type';
}

async function main() {
  let output: string;
  
  // If a specific file is provided, focus on that file
  if (FOCUS_FILE) {
    output = await runTsc(FOCUS_FILE);
  } else {
    // Otherwise, run on the whole project
    output = await runTsc();
  }
  
  // Check if there are errors
  if (!output.includes('error TS')) {
    console.log('\n✅ No TypeScript errors found!');
    return;
  }
  
  // Parse errors
  const errors = parseErrors(output);
  
  // Filter out test files
  const sourceErrors = errors.filter(error => !shouldSkipFile(error.filePath));
  
  if (sourceErrors.length === 0) {
    console.log('No errors in source files found (only in test files).');
    return;
  }
  
  // Just take the first error
  const error = sourceErrors[0];
  
  console.log('\n🔴 Next Error to Fix:');
  console.log(`File: ${error.filePath}`);
  console.log(`Line: ${error.line}, Column: ${error.column}`);
  console.log(`Error Code: TS${error.code}`);
  console.log(`Message: ${error.message}`);
  
  // Show the context of the error
  showErrorContext(error.filePath, error.line);
  
  // Suggest fixes based on error type
  console.log('\n💡 Suggested solution:');
  console.log(suggestFix(error));
  
  // Common next steps guidance
  console.log('\n📝 Next steps:');
  console.log(`1. Edit ${error.filePath}`);
  console.log(`2. Fix the issue at line ${error.line} based on the suggestion`);
  console.log(`3. Run this script again to check if the error is resolved`);
  
  console.log(`\n📊 Progress: ${sourceErrors.length} errors remaining in source files`);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 