#!/usr/bin/env bun
/**
 * scripts/analyse-bundle.ts
 * 
 * A comprehensive bundle analysis tool for the mtrl library.
 * This script generates detailed reports on bundle size, composition,
 * and optimization opportunities in Markdown format.
 * 
 * Usage:
 *   bun run scripts/analyse-bundle.ts [--detailed] [--clean]
 * 
 * Options:
 *   --detailed: Generate individual component analysis (slower but more thorough)
 *   --clean: Clean analysis directory before running
 */

import { mkdir, rm, readdir } from 'node:fs/promises';
import { join, basename, resolve } from 'node:path';
import { existsSync } from 'node:fs';

// Configuration
const DIST_DIR = './dist';
const SRC_DIR = './src';
const ANALYSIS_DIR = './analysis';
const TEMP_DIR = join(ANALYSIS_DIR, 'temp');
const COMPONENTS_DIR = join(SRC_DIR, 'components');
const CORE_MODULES = ['compose', 'dom', 'state', 'utils'];

// CLI options
const DETAILED_ANALYSIS = process.argv.includes('--detailed');
const CLEAN_FIRST = process.argv.includes('--clean');

// Component metadata for reporting
const COMPONENT_METADATA = {
  button: { name: 'Button', description: 'Basic interactive button component' },
  checkbox: { name: 'Checkbox', description: 'Form checkbox component' },
  slider: { name: 'Slider', description: 'Range slider input component' },
  menu: { name: 'Menu', description: 'Dropdown menu component' },
  textfield: { name: 'Text Field', description: 'Input field component' },
  switch: { name: 'Switch', description: 'Toggle switch component' },
  radios: { name: 'Radio', description: 'Radio button component' },
  fab: { name: 'FAB', description: 'Floating action button' },
  card: { name: 'Card', description: 'Material card component' },
  dialog: { name: 'Dialog', description: 'Modal dialog component' },
  snackbar: { name: 'Snackbar', description: 'Notification component' },
  tooltip: { name: 'Tooltip', description: 'Contextual tooltip component' },
  badge: { name: 'Badge', description: 'Notification badge component' }
};

// Helper function to ensure a directory exists
async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// Format bytes to human-readable form
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Calculate compression ratio
function compressionRatio(original, compressed) {
  if (original === 0) return '0%';
  return ((compressed / original) * 100).toFixed(1) + '%';
}

// Measure the size of a file in different formats using Bun APIs
async function measureFileSize(filePath) {
  if (!existsSync(filePath)) {
    return { raw: 0, gzipped: 0 };
  }

  try {
    // Use Bun's file API for efficient reading
    const file = Bun.file(filePath);
    const content = await file.arrayBuffer();
    const raw = content.byteLength;
    
    // Use Bun's native gzip compression
    const gzipped = Bun.gzipSync(new Uint8Array(content)).byteLength;
    
    return { raw, gzipped };
  } catch (error) {
    console.error(`Error measuring file size for ${filePath}:`, error);
    return { raw: 0, gzipped: 0 };
  }
}

// Clean analysis directories
async function cleanDirectories() {
  if (CLEAN_FIRST) {
    console.log('Cleaning analysis directories...');
    if (existsSync(ANALYSIS_DIR)) {
      await rm(ANALYSIS_DIR, { recursive: true, force: true });
    }
  }
  
  await ensureDir(ANALYSIS_DIR);
  await ensureDir(TEMP_DIR);
  await ensureDir(join(ANALYSIS_DIR, 'components'));
  await ensureDir(join(ANALYSIS_DIR, 'core'));
}

// Analyze the main bundle
async function analyzeMainBundle() {
  console.log('Analyzing main bundle...');
  
  const mainJsPath = join(DIST_DIR, 'index.js');
  const mainCjsPath = join(DIST_DIR, 'index.cjs');
  const stylesCssPath = join(DIST_DIR, 'styles.css');
  
  // Measure sizes
  const esm = await measureFileSize(mainJsPath);
  const cjs = await measureFileSize(mainCjsPath);
  const css = await measureFileSize(stylesCssPath);
  
  // Calculate total size
  const total = {
    raw: esm.raw + css.raw,
    gzipped: esm.gzipped + css.gzipped
  };
  
  return {
    esm,
    cjs,
    css,
    total
  };
}

// Build and analyze individual components
async function analyzeComponents() {
  if (!DETAILED_ANALYSIS) {
    console.log('Skipping detailed component analysis (use --detailed to enable)');
    return {};
  }

  console.log('Analyzing individual components...');
  
  const components = {};
  
  try {
    const componentDirs = await readdir(COMPONENTS_DIR);
    
    for (const component of componentDirs) {
      // Skip non-directories and hidden files
      const componentPath = join(COMPONENTS_DIR, component);
      const componentIndexPath = join(componentPath, 'index.ts');
      
      if (component.startsWith('.') || !existsSync(componentIndexPath)) {
        continue;
      }
      
      console.log(`Analyzing ${component} component...`);
      
      // Create a minimal test file that directly imports the component
      const testFilePath = join(TEMP_DIR, `${component}-test.js`);
      
      // Use absolute paths to avoid resolution issues
      const absoluteComponentPath = resolve(componentIndexPath);
      await Bun.write(testFilePath, `import * as component from '${absoluteComponentPath}';\nconsole.log(component);`);
      
      try {
        // Build this test file
        const result = await Bun.build({
          entrypoints: [testFilePath],
          outdir: join(TEMP_DIR, component),
          minify: true
        });
        
        if (!result.success) {
          console.warn(`Failed to build ${component} component:`, result.logs);
          continue;
        }
        
        // Measure the output size
        const outFilePath = join(TEMP_DIR, component, `${component}-test.js`);
        const sizes = await measureFileSize(outFilePath);
        
        components[component] = {
          name: COMPONENT_METADATA[component]?.name || component,
          description: COMPONENT_METADATA[component]?.description || '',
          ...sizes
        };
      } catch (error) {
        console.error(`Error building ${component} component:`, error);
      }
    }
  } catch (error) {
    console.error('Error analyzing components:', error);
  }
  
  return components;
}

// Analyze core modules
async function analyzeCoreModules() {
  if (!DETAILED_ANALYSIS) {
    console.log('Skipping detailed core module analysis (use --detailed to enable)');
    return {};
  }

  console.log('Analyzing core modules...');
  
  const modules = {};
  
  try {
    for (const module of CORE_MODULES) {
      console.log(`Analyzing ${module} module...`);
      
      const moduleIndexPath = join(SRC_DIR, 'core', module, 'index.ts');
      
      if (!existsSync(moduleIndexPath)) {
        console.warn(`Module index not found: ${moduleIndexPath}`);
        continue;
      }
      
      // Create a minimal test file that directly imports the module
      const testFilePath = join(TEMP_DIR, `${module}-test.js`);
      
      // Use absolute paths to avoid resolution issues
      const absoluteModulePath = resolve(moduleIndexPath);
      await Bun.write(testFilePath, `import * as module from '${absoluteModulePath}';\nconsole.log(module);`);
      
      try {
        // Build this test file
        const result = await Bun.build({
          entrypoints: [testFilePath],
          outdir: join(TEMP_DIR, 'core', module),
          minify: true
        });
        
        if (!result.success) {
          console.warn(`Failed to build ${module} module:`, result.logs);
          continue;
        }
        
        // Measure the output size
        const outFilePath = join(TEMP_DIR, 'core', module, `${module}-test.js`);
        const sizes = await measureFileSize(outFilePath);
        
        modules[module] = {
          name: module.charAt(0).toUpperCase() + module.slice(1),
          ...sizes
        };
      } catch (error) {
        console.error(`Error building ${module} module:`, error);
      }
    }
  } catch (error) {
    console.error('Error analyzing core modules:', error);
  }
  
  return modules;
}

// Generate a visual bar in markdown with proper bounds checking
function generateMarkdownBar(percentage, width = 20) {
  // Ensure percentage is a valid number and within bounds
  const validPercentage = Math.max(0, Math.min(100, parseFloat(percentage) || 0));
  const filledChars = Math.round((validPercentage / 100) * width);
  const emptyChars = Math.max(0, width - filledChars);
  
  return '█'.repeat(filledChars) + '░'.repeat(emptyChars);
}

// Calculate safe percentage with bounds checking
function calculatePercentage(value, total) {
  if (!total || total === 0 || !value || isNaN(value) || isNaN(total)) {
    return '0.0';
  }
  return ((value / total) * 100).toFixed(1);
}

// Generate a detailed Markdown report
async function generateMarkdownReport(data) {
  console.log('Generating Markdown report...');
  
  // Get total size safely
  const totalSize = data.main.total.raw || 1; // Avoid division by zero
  
  // Sort components by size for reporting
  const sortedComponents = Object.entries(data.components || {})
    .filter(([_, comp]) => comp.raw > 0) // Filter out empty components
    .sort((a, b) => b[1].raw - a[1].raw)
    .map(([id, comp]) => ({
      id,
      ...comp,
      percentage: calculatePercentage(comp.raw, totalSize)
    }));
  
  // Sort core modules by size for reporting
  const sortedModules = Object.entries(data.core || {})
    .filter(([_, mod]) => mod.raw > 0) // Filter out empty modules
    .sort((a, b) => b[1].raw - a[1].raw)
    .map(([id, mod]) => ({
      id,
      ...mod,
      percentage: calculatePercentage(mod.raw, totalSize)
    }));
  
  // Generate Markdown content
  let markdown = `# mtrl Bundle Analysis Report

*Generated on ${new Date().toLocaleString()}*

## Bundle Summary

### Overall Size
- **Total Minified Size**: ${formatBytes(data.main.total.raw)}
- **Total Gzipped Size**: ${formatBytes(data.main.total.gzipped)} (${compressionRatio(data.main.total.raw, data.main.total.gzipped)} of original)

### JavaScript Bundles
- **ESM Bundle**: ${formatBytes(data.main.esm.raw)} (${formatBytes(data.main.esm.gzipped)} gzipped)
- **CommonJS Bundle**: ${formatBytes(data.main.cjs.raw)} (${formatBytes(data.main.cjs.gzipped)} gzipped)

### CSS
- **Minified CSS**: ${formatBytes(data.main.css.raw)} (${formatBytes(data.main.css.gzipped)} gzipped)
- **Compression Ratio**: ${compressionRatio(data.main.css.raw, data.main.css.gzipped)}

`;

  if (DETAILED_ANALYSIS && sortedComponents.length > 0) {
    markdown += `
## Component Breakdown

Individual component sizes and their contribution to the total bundle.

| Component | Description | Minified | Gzipped | % of Bundle | Visualization |
|-----------|-------------|----------|---------|-------------|---------------|
`;

    sortedComponents.forEach(comp => {
      markdown += `| **${comp.name}** | ${comp.description || 'Component'} | ${formatBytes(comp.raw)} | ${formatBytes(comp.gzipped)} | ${comp.percentage}% | ${generateMarkdownBar(comp.percentage)} |\n`;
    });
  }

  if (DETAILED_ANALYSIS && sortedModules.length > 0) {
    markdown += `
## Core Module Breakdown

Size of core utility modules used across components.

| Module | Minified | Gzipped | % of Bundle | Visualization |
|--------|----------|---------|-------------|---------------|
`;

    sortedModules.forEach(mod => {
      markdown += `| **${mod.name}** | ${formatBytes(mod.raw)} | ${formatBytes(mod.gzipped)} | ${mod.percentage}% | ${generateMarkdownBar(mod.percentage)} |\n`;
    });
  } else if (!DETAILED_ANALYSIS) {
    markdown += `
> **Note**: For a detailed component and module breakdown, run the analysis with the \`--detailed\` flag:
> 
> \`\`\`
> bun run scripts/analyse-bundle.ts --detailed
> \`\`\`
`;
  }

  markdown += `
## Optimization Opportunities

### Potential Optimizations

1. **Tree-shaking**: Ensure all exports are properly structured for effective tree-shaking
2. **Code splitting**: Consider lazy-loading complex or rarely used components
3. **Shared utilities**: Look for duplicated utility functions across components
4. **CSS optimization**: Consider component-specific CSS imports instead of a single bundle
5. **Minification**: Check for additional minification options like mangling private properties

## Bundle Comparison

To see how your bundle compares to other libraries:

| Library | Size (min+gzip) | Description |
|---------|----------------|-------------|
| mtrl (your library) | ${formatBytes(data.main.total.gzipped)} | Material Design 3 component library |
| Material UI (core) | ~80 KB | React UI framework based on Material Design |
| Bootstrap (JS+CSS) | ~30 KB | Popular CSS framework with JS components |
| Preact | ~4 KB | Lightweight alternative to React |
| lit-element | ~7 KB | Web components base library |

---

*Generated by scripts/analyse-bundle.ts | mtrl library*
`;

  // Write the report file using Bun's write API
  const reportPath = join(ANALYSIS_DIR, 'bundle-report.md');
  await Bun.write(reportPath, markdown);
  
  console.log(`✅ Markdown report generated at ${reportPath}`);
  return reportPath;
}

// Main function
async function main() {
  console.log('🔍 Starting bundle analysis...');
  
  try {
    // Clean directories
    await cleanDirectories();
    
    // Analyze main bundle
    const mainData = await analyzeMainBundle();
    
    // Analyze components and core modules if detailed flag is set
    const componentsData = await analyzeComponents();
    const coreData = await analyzeCoreModules();
    
    // Generate report
    const reportData = {
      main: mainData,
      components: componentsData,
      core: coreData
    };
    
    const reportPath = await generateMarkdownReport(reportData);
    
    // Summary output to console
    console.log('\n📊 Bundle Size Summary:');
    console.log(`Total bundle size: ${formatBytes(mainData.total.raw)} (${formatBytes(mainData.total.gzipped)} gzipped)`);
    console.log(`JavaScript (ESM): ${formatBytes(mainData.esm.raw)} (${formatBytes(mainData.esm.gzipped)} gzipped)`);
    console.log(`CSS: ${formatBytes(mainData.css.raw)} (${formatBytes(mainData.css.gzipped)} gzipped)`);
    
    console.log(`\n✅ Analysis completed successfully. Report saved to ${reportPath}`);
    if (!DETAILED_ANALYSIS) {
      console.log('\nTip: Run with --detailed flag for component-level breakdown:');
      console.log('  bun run scripts/analyse-bundle.ts --detailed');
    }
  } catch (error) {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();