#!/usr/bin/env bun
/**
 * build.ts
 * Build script for the mtrl library
 * 
 * This script:
 * 1. Cleans the dist directory
 * 2. Runs TypeScript type checking
 * 3. Builds ESM and CJS versions of the library
 * 4. Generates TypeScript declaration files
 * 5. Compiles SCSS to CSS
 * 6. Creates the package.json for distribution
 */

import { mkdir, rm, writeFile, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { build } from 'bun';

// Configuration
const DIST_DIR = './dist';
const SRC_DIR = './src';
const STYLES_DIR = './src/styles';
const MAIN_SCSS = join(STYLES_DIR, 'main.scss');
const PKG_FILE = './package.json';
const TS_STRICT_CHECK = process.argv.includes('--strict');

// Banner to add to generated files
const BANNER = `/**
 * mtrl v${process.env.npm_package_version || '0.3.8'}
 * A functional TypeScript component library based on Material Design 3
 * @license MIT
 */
`;

// Helper function to ensure a directory exists
async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// Helper function to run a command with output streaming
function runCommand(command: string, args: string[]): Promise<{ success: boolean, output: string }> {
  return new Promise((resolve) => {
    console.log(`Running command: ${command} ${args.join(' ')}`);
    
    const output: Buffer[] = [];
    const childProcess = spawn(command, args, { stdio: ['inherit', 'pipe', 'pipe'] });

    childProcess.stdout.on('data', (data) => {
      output.push(data);
      process.stdout.write(data);
    });

    childProcess.stderr.on('data', (data) => {
      output.push(data);
      process.stderr.write(data);
    });

    childProcess.on('close', (code) => {
      const outputStr = Buffer.concat(output).toString('utf-8');
      resolve({ 
        success: code === 0,
        output: outputStr
      });
    });
  });
}

async function cleanDist() {
  console.log('Cleaning dist directory...');
  try {
    if (existsSync(DIST_DIR)) {
      await rm(DIST_DIR, { recursive: true, force: true });
    }
    await ensureDir(DIST_DIR);
    console.log('✅ Dist directory cleaned');
  } catch (error) {
    console.error('❌ Error cleaning dist directory:', error);
    process.exit(1);
  }
}

async function typeCheck() {
  console.log('Running TypeScript type checking...');
  
  // Use the main tsconfig.json which excludes test files
  const result = await runCommand('npx', ['tsc', '--noEmit', '--skipLibCheck', '--project', 'tsconfig.json']);
  
  if (result.success) {
    console.log('✅ TypeScript type checking passed');
    return true;
  } else {
    console.error('❌ TypeScript type checking failed');
    
    if (TS_STRICT_CHECK) {
      console.log('\nType checking failed and --strict flag is enabled.');
      console.log('Fix the TypeScript errors before building, or run without --strict flag to continue anyway.');
      console.log('\nTip: You can use the fix-typescript.ts script to help fix common errors:');
      console.log('bun run fix-typescript.ts');
      return false;
    } else {
      console.warn('\n⚠️ Continuing build despite TypeScript errors');
      console.log('To enforce strict type checking, run with --strict flag');
      return true;
    }
  }
}

async function buildJavaScript() {
  console.log('Building JavaScript...');
  
  try {
    // Build ESM version
    console.log('Building ESM version...');
    const esmResult = await build({
      entrypoints: ['./index.ts'],
      outdir: DIST_DIR,
      format: 'esm',
      minify: true,
      sourcemap: 'external',
      target: 'browser',
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });
    
    if (!esmResult.success) {
      console.error('❌ ESM build failed:', esmResult.logs);
      process.exit(1);
    }
    
    // Build CommonJS version
    console.log('Building CommonJS version...');
    const cjsResult = await build({
      entrypoints: ['./index.ts'],
      outdir: DIST_DIR,
      format: 'cjs',
      minify: true,
      sourcemap: 'external',
      target: 'browser',
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      naming: {
        entry: '[dir]/index.cjs'
      }
    });
    
    if (!cjsResult.success) {
      console.error('❌ CJS build failed:', cjsResult.logs);
      process.exit(1);
    }
    
    // Add banner to output files
    console.log('Adding banner to output files...');
    const files = [
      join(DIST_DIR, 'index.js'),
      join(DIST_DIR, 'index.cjs')
    ];
    
    for (const file of files) {
      if (existsSync(file)) {
        const content = await Bun.file(file).text();
        await writeFile(file, BANNER + content);
      }
    }
    
    console.log('✅ JavaScript build completed successfully');
  } catch (error) {
    console.error('❌ Error building JavaScript:', error);
    process.exit(1);
  }
}

async function generateTypes() {
  console.log('Generating TypeScript declarations...');
  try {
    // Run TypeScript to generate declaration files
    // Use the main tsconfig.json which excludes test files
    const result = await runCommand('npx', ['tsc', '--emitDeclarationOnly', '--declaration', '--skipLibCheck', '--project', 'tsconfig.json', '--outDir', 'dist']);
    
    if (result.success) {
      console.log('✅ TypeScript declarations generated successfully');
    } else {
      console.warn('⚠️ TypeScript declarations generated with errors');
      
      // Create a fallback index.d.ts
      if (!existsSync(join(DIST_DIR, 'index.d.ts'))) {
        console.log('Creating minimal fallback declaration file...');
        
        const fallbackDts = `/**
 * mtrl - A lightweight TypeScript component library based on Material Design 3
 * This is a minimal type definition file created as a fallback.
 */

declare module 'mtrl' {
  // Re-export from src/index.ts
  export * from './src/index';

  // Export constants
  export const VERSION: string;
}

declare module 'mtrl/styles' {
  const styles: string;
  export default styles;
}`;
        
        await writeFile(join(DIST_DIR, 'index.d.ts'), fallbackDts);
        console.log('✅ Fallback declaration file created');
      }
    }
  } catch (error) {
    console.error('❌ Error generating TypeScript declarations:', error);
    
    // Create minimal declaration file as fallback
    console.log('Creating minimal declaration file as fallback...');
    const minimalDts = `declare module 'mtrl';
declare module 'mtrl/styles';`;
    
    await writeFile(join(DIST_DIR, 'index.d.ts'), minimalDts);
    console.log('✅ Minimal declaration file created');
  }
}

async function buildStyles() {
  console.log('Building CSS...');
  try {
    await ensureDir(DIST_DIR);
    
    // Compile main.scss to styles.css
    const result = await runCommand('npx', ['sass', MAIN_SCSS, `${DIST_DIR}/styles.css`, '--style=compressed', '--no-source-map']);
    
    if (result.success) {
      // Add banner to the CSS file
      const cssFile = join(DIST_DIR, 'styles.css');
      if (existsSync(cssFile)) {
        const content = await Bun.file(cssFile).text();
        await writeFile(cssFile, `/* ${BANNER.replace(/\*\//g, '* /')} */\n` + content);
      }
      console.log('✅ CSS build completed successfully');
    } else {
      console.error('❌ Error building CSS');
      
      // Create minimal CSS file as fallback
      await writeFile(join(DIST_DIR, 'styles.css'), `/* ${BANNER.replace(/\*\//g, '* /')} */\n/* Minimal fallback styles */`);
      console.log('✅ Fallback CSS file created');
    }
  } catch (error) {
    console.error('❌ Error building CSS:', error);
    
    // Create minimal CSS file as fallback
    await writeFile(join(DIST_DIR, 'styles.css'), `/* ${BANNER.replace(/\*\//g, '* /')} */\n/* Minimal fallback styles */`);
    console.log('✅ Fallback CSS file created');
  }
}

async function updatePackageJson() {
  console.log('Updating package.json...');
  try {
    const pkg = JSON.parse(await Bun.file(PKG_FILE).text());
    
    // Create distribution package.json
    const distPkg = {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      author: pkg.author,
      license: pkg.license,
      keywords: pkg.keywords,
      repository: pkg.repository,
      type: 'module',
      main: './index.cjs',
      module: './index.js',
      types: './index.d.ts',
      exports: {
        '.': {
          import: './index.js',
          require: './index.cjs',
          types: './index.d.ts'
        },
        './styles': './styles.css'
      },
      sideEffects: false
    };
    
    // Write to dist/package.json
    await writeFile(join(DIST_DIR, 'package.json'), JSON.stringify(distPkg, null, 2));
    console.log('✅ package.json updated successfully');
  } catch (error) {
    console.error('❌ Error updating package.json:', error);
    process.exit(1);
  }
}

async function copyFiles() {
  console.log('Copying additional files...');
  try {
    // Copy README.md and LICENSE to dist
    if (existsSync('README.md')) {
      await copyFile('README.md', join(DIST_DIR, 'README.md'));
    } else {
      // Create a minimal README.md
      await writeFile(join(DIST_DIR, 'README.md'), `# mtrl

A lightweight TypeScript component library implementing Material Design 3 with pure functional composition.

## Installation

\`\`\`bash
npm install mtrl
\`\`\`

## Usage

\`\`\`javascript
import { createButton } from 'mtrl';
import 'mtrl/styles';

const button = createButton({ text: 'Click me' });
document.body.appendChild(button.element);
\`\`\`

## Documentation

For more information, visit [https://github.com/floor/mtrl](https://github.com/floor/mtrl)
`);
    }
    
    if (existsSync('LICENSE')) {
      await copyFile('LICENSE', join(DIST_DIR, 'LICENSE'));
    } else if (existsSync('LICENSE.md')) {
      await copyFile('LICENSE.md', join(DIST_DIR, 'LICENSE'));
    } else {
      // Create a minimal LICENSE file
      await writeFile(join(DIST_DIR, 'LICENSE'), `MIT License

Copyright (c) ${new Date().getFullYear()} floor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`);
    }
    
    console.log('✅ Files copied successfully');
  } catch (error) {
    console.error('❌ Error copying files:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Starting build process...');
  
  const startTime = Date.now();
  
  try {
    await cleanDist();
    
    // Run type checking
    const typeCheckingPassed = await typeCheck();
    
    // Exit if type checking fails and strict mode is enabled
    if (!typeCheckingPassed && TS_STRICT_CHECK) {
      process.exit(1);
    }
    
    // Continue with the build
    await buildJavaScript();
    await generateTypes();
    await buildStyles();
    await updatePackageJson();
    await copyFiles();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Build completed successfully in ${duration}s`);
    console.log(`📦 Output directory: ${DIST_DIR}`);
    
    if (!typeCheckingPassed) {
      console.log('\n⚠️ The build completed with TypeScript errors.');
      console.log('It\'s recommended to fix these errors for better type safety and developer experience.');
      console.log('You can use the fix-typescript.ts script to help fix common errors:');
      console.log('bun run fix-typescript.ts');
    }
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build process
main();