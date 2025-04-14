#!/usr/bin/env bun

/**
 * scripts/analyze.ts
 * 
 * This script analyzes the src directory of the project to provide insights
 * about the codebase structure, documentation patterns, and TypeScript usage.
 * This information will be used to make decisions about documentation strategies.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Statistics to collect
interface DocStats {
  filesWithHeaderComment: number;
  filesWithJSDocFormat: number;
  averageCommentLines: number;
  totalCommentLines: number;
  filesWithTypeDoc: number;
  filesWithPathComment: number;
}

interface DirectoryStats {
  files: number;
  ts: number;
  js: number;
  otherFiles: number;
  subdirectories: string[];
}

interface FileWithCount {
  name: string;
  count: number;
}

interface CodebaseStats {
  totalFiles: number;
  typescript: number;
  javascript: number;
  markdown: number;
  otherFiles: number;
  
  // Documentation patterns
  fileHeaderDocs: number;
  classOrInterfaceDocs: number;
  functionDocs: number;
  methodDocs: number;
  propertyDocs: number;
  
  // JSDoc vs TSDoc
  jsdocUsage: number;
  tsdocUsage: number;
  
  // Exports/Imports
  exportedItems: number;
  importedItems: number;
  
  // Components
  componentCount: number;
  
  // File structure
  directories: Record<string, DirectoryStats>;
  
  // Additional insights
  fileWithMostExports: FileWithCount;
  fileWithMostComments: FileWithCount;
  
  // Detailed documentation stats
  docStats: DocStats;
}

// Initialize statistics
const stats: CodebaseStats = {
  totalFiles: 0,
  typescript: 0,
  javascript: 0,
  markdown: 0,
  otherFiles: 0,
  
  fileHeaderDocs: 0,
  classOrInterfaceDocs: 0,
  functionDocs: 0,
  methodDocs: 0,
  propertyDocs: 0,
  
  jsdocUsage: 0,
  tsdocUsage: 0,
  
  exportedItems: 0,
  importedItems: 0,
  
  componentCount: 0,
  
  directories: {},
  
  fileWithMostExports: { name: '', count: 0 },
  fileWithMostComments: { name: '', count: 0 },
  
  docStats: {
    filesWithHeaderComment: 0,
    filesWithJSDocFormat: 0,
    averageCommentLines: 0,
    totalCommentLines: 0,
    filesWithTypeDoc: 0,
    filesWithPathComment: 0,
  }
};

/**
 * Checks if a file contains TSDoc/JSDoc style comments (@-prefixed tags)
 */
function detectDocFormat(content: string): { hasJSDocFormat: boolean; hasTSDocFormat: boolean } {
  const hasJSDocFormat = /@\w+/.test(content);
  const hasTSDocFormat = /@\w+/.test(content) && /\/\*\*[\s\S]*?\*\//.test(content);
  
  // Count JSDoc/TSDoc usage
  if (hasJSDocFormat) stats.jsdocUsage++;
  if (hasTSDocFormat) stats.tsdocUsage++;
  
  return { hasJSDocFormat, hasTSDocFormat };
}

/**
 * Checks if a file starts with a path comment (e.g. // src/components/...)
 */
function hasPathComment(content: string): boolean {
  const firstLine = content.split('\n')[0].trim();
  return /^\/\/\s+src\//.test(firstLine);
}

/**
 * Counts documentation patterns in the file content
 */
function countDocumentationPatterns(content: string): { commentCount: number; commentLines: number } {
  // Check for file header documentation
  if (/\/\*\*[\s\S]*?\*\//.test(content.substring(0, 500))) {
    stats.fileHeaderDocs++;
  }
  
  // Count class/interface documentation
  const classInterfaceDocs = (content.match(/\/\*\*[\s\S]*?\*\/\s*(export\s+)?(abstract\s+)?(class|interface)/g) || []).length;
  stats.classOrInterfaceDocs += classInterfaceDocs;
  
  // Count function documentation
  const functionDocs = (content.match(/\/\*\*[\s\S]*?\*\/\s*(export\s+)?function/g) || []).length;
  stats.functionDocs += functionDocs;
  
  // Count method documentation
  const methodDocs = (content.match(/\/\*\*[\s\S]*?\*\/\s*\w+\s*\(/g) || []).length - functionDocs;
  stats.methodDocs += methodDocs > 0 ? methodDocs : 0;
  
  // Count property documentation
  const propertyDocs = (content.match(/\/\*\*[\s\S]*?\*\/\s*\w+\s*:/g) || []).length;
  stats.propertyDocs += propertyDocs;
  
  // Count total comments
  const allComments = (content.match(/\/\*\*[\s\S]*?\*\/|\/\/[^\n]*/g) || []);
  const commentCount = allComments.length;
  
  // Count total lines of comments
  let commentLines = 0;
  allComments.forEach(comment => {
    commentLines += comment.split('\n').length;
  });
  
  stats.docStats.totalCommentLines += commentLines;
  
  return { commentCount, commentLines };
}

/**
 * Count exported items from a file
 */
function countExports(content: string): number {
  const exportMatches = content.match(/export\s+(default\s+)?(const|let|var|function|class|interface|type|enum)/g) || [];
  return exportMatches.length;
}

/**
 * Count imported items to a file
 */
function countImports(content: string): number {
  const importMatches = content.match(/import\s+[^;]+\s+from/g) || [];
  return importMatches.length;
}

/**
 * Check if a file likely defines a component
 */
function isComponentFile(filePath: string, content: string): boolean {
  const hasCreateComponent = /create\w+\s*=/.test(content) || /function\s+create\w+/.test(content);
  const hasComponentInPath = /component|components/.test(filePath);
  
  return hasCreateComponent || (hasComponentInPath && /export default/.test(content));
}

/**
 * Process a single file
 */
async function processFile(filePath: string): Promise<void> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const content = await fs.readFile(filePath, 'utf8');
    
    // Update count based on file type
    stats.totalFiles++;
    
    if (ext === '.ts' || ext === '.tsx') {
      stats.typescript++;
    } else if (ext === '.js' || ext === '.jsx') {
      stats.javascript++;
    } else if (ext === '.md') {
      stats.markdown++;
    } else {
      stats.otherFiles++;
    }
    
    // Skip non-script files
    if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      return;
    }
    
    // Check for file header
    if (content.trimStart().startsWith('/*') || content.trimStart().startsWith('//')) {
      stats.docStats.filesWithHeaderComment++;
    }
    
    // Check for path comment
    if (hasPathComment(content)) {
      stats.docStats.filesWithPathComment++;
    }
    
    // Detect documentation format
    const { hasJSDocFormat } = detectDocFormat(content);
    if (hasJSDocFormat) {
      stats.docStats.filesWithJSDocFormat++;
    }
    
    // Check for TypeDoc usage
    if (/@module|@category|@remarks|@example/.test(content)) {
      stats.docStats.filesWithTypeDoc++;
    }
    
    // Count documentation patterns
    const { commentCount } = countDocumentationPatterns(content);
    
    // Keep track of file with most comments
    if (commentCount > stats.fileWithMostComments.count) {
      stats.fileWithMostComments = { name: filePath, count: commentCount };
    }
    
    // Count exports
    const exportCount = countExports(content);
    stats.exportedItems += exportCount;
    
    // Keep track of file with most exports
    if (exportCount > stats.fileWithMostExports.count) {
      stats.fileWithMostExports = { name: filePath, count: exportCount };
    }
    
    // Count imports
    stats.importedItems += countImports(content);
    
    // Check if this is a component file
    if (isComponentFile(filePath, content)) {
      stats.componentCount++;
    }
    
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
  }
}

/**
 * Recursively walk through directories and process files
 */
async function walk(dir: string, relativePath = ''): Promise<void> {
  try {
    const entries = await fs.readdir(dir);
    
    // Initialize stats for this directory
    if (!stats.directories[relativePath]) {
      stats.directories[relativePath || 'root'] = {
        files: 0,
        ts: 0,
        js: 0,
        otherFiles: 0,
        subdirectories: []
      };
    }
    
    const dirStats = stats.directories[relativePath || 'root'];
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const entryStats = await fs.stat(fullPath);
      
      if (entryStats.isDirectory()) {
        const newRelativePath = relativePath ? `${relativePath}/${entry}` : entry;
        dirStats.subdirectories.push(entry);
        await walk(fullPath, newRelativePath);
      } else {
        dirStats.files++;
        
        const ext = path.extname(entry).toLowerCase();
        if (ext === '.ts' || ext === '.tsx') {
          dirStats.ts++;
        } else if (ext === '.js' || ext === '.jsx') {
          dirStats.js++;
        } else {
          dirStats.otherFiles++;
        }
        
        await processFile(fullPath);
      }
    }
    
  } catch (err) {
    console.error(`Error walking directory ${dir}:`, err);
  }
}

/**
 * Generate insights from the collected stats
 */
function generateInsights(): {
  summary: string;
  documentationPatterns: string;
  detailedStats: string;
  insights: string;
  recommendations: string;
} {
  // Calculate average comments per file
  stats.docStats.averageCommentLines = Math.round(stats.docStats.totalCommentLines / stats.totalFiles * 10) / 10;
  
  // Calculate percentages
  const pathCommentPercentage = Math.round((stats.docStats.filesWithPathComment / stats.totalFiles) * 100);
  const headerCommentPercentage = Math.round((stats.docStats.filesWithHeaderComment / stats.totalFiles) * 100);
  const jsdocFormatPercentage = Math.round((stats.docStats.filesWithJSDocFormat / stats.totalFiles) * 100);
  const typeDocPercentage = Math.round((stats.docStats.filesWithTypeDoc / stats.totalFiles) * 100);
  
  // Format insights
  return {
    summary: `
    📊 Code Analysis Summary:
    - Total files: ${stats.totalFiles} (${stats.typescript} TypeScript, ${stats.javascript} JavaScript, ${stats.markdown} Markdown)
    - Components identified: ${stats.componentCount}
    - Total exported items: ${stats.exportedItems}, Total imports: ${stats.importedItems}
    `,
    documentationPatterns: `
    📝 Documentation Patterns:
    - Files with path comments (// src/...): ${stats.docStats.filesWithPathComment} (${pathCommentPercentage}%)
    - Files with header comments: ${stats.docStats.filesWithHeaderComment} (${headerCommentPercentage}%)
    - Files using JSDoc format: ${stats.docStats.filesWithJSDocFormat} (${jsdocFormatPercentage}%)
    - Files with TypeDoc annotations: ${stats.docStats.filesWithTypeDoc} (${typeDocPercentage}%)
    - Average comment lines per file: ${stats.docStats.averageCommentLines}
    `,
    detailedStats: `
    🔍 Detailed Documentation:
    - File header docs: ${stats.fileHeaderDocs}
    - Class/Interface docs: ${stats.classOrInterfaceDocs}
    - Function docs: ${stats.functionDocs}
    - Method docs: ${stats.methodDocs}
    - Property docs: ${stats.propertyDocs}
    `,
    insights: `
    💡 Key Insights:
    - File with most comments: ${stats.fileWithMostComments.name} (${stats.fileWithMostComments.count} comments)
    - File with most exports: ${stats.fileWithMostExports.name} (${stats.fileWithMostExports.count} exports)
    - JSDoc usage: ${stats.jsdocUsage} files
    - Documentation preference: ${stats.jsdocUsage > stats.tsdocUsage ? 'JSDoc' : 'TSDoc'} style is more common
    `,
    recommendations: `
    🚀 Documentation Recommendations:
    - ${pathCommentPercentage < 80 ? 'Add path comments to all files for consistency' : 'Keep using path comments consistently'}
    - ${jsdocFormatPercentage < 70 ? 'Increase JSDoc-style documentation for public APIs' : 'Current JSDoc coverage is good'}
    - ${typeDocPercentage < 50 ? 'Consider adopting TypeDoc for improved TypeScript documentation' : 'Current TypeDoc usage is adequate'}
    - ${stats.docStats.averageCommentLines < 5 ? 'Aim for more comprehensive documentation with examples' : 'Current documentation depth is good'}
    `
  };
}

/**
 * Generate a directory structure visualization
 */
function generateDirectoryTree(): string {
  let tree = '📁 src\n';
  
  function buildTree(dirName: string, prefix = ''): string {
    const dir = stats.directories[dirName || 'root'];
    if (!dir) return '';
    
    let result = '';
    
    // Add subdirectories
    const subdirs = dir.subdirectories.sort();
    subdirs.forEach((subdir, index) => {
      const isLast = index === subdirs.length - 1;
      const newPrefix = prefix + (isLast ? '   ' : '│  ');
      
      const fullPath = dirName ? `${dirName}/${subdir}` : subdir;
      const subDirStats = stats.directories[fullPath];
      
      if (!subDirStats) return;
      
      const fileCount = subDirStats.files > 0 ? ` (${subDirStats.ts + subDirStats.js} files)` : '';
      
      result += `${prefix}${isLast ? '└──' : '├──'} 📁 ${subdir}${fileCount}\n`;
      result += buildTree(fullPath, newPrefix);
    });
    
    return result;
  }
  
  return tree + buildTree('root');
}

/**
 * Main function to run the analysis
 */
async function main(): Promise<void> {
  const srcPath = path.resolve('./src');
  
  // Check if the src directory exists
  try {
    await fs.stat(srcPath);
  } catch (err) {
    console.error('src directory not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  console.log('📊 Analyzing codebase...');
  await walk(srcPath);
  
  // Generate insights
  const insights = generateInsights();
  
  // Generate directory tree
  const directoryTree = generateDirectoryTree();
  
  // Output the results
  console.log('🔍 Code Analysis Results');
  console.log('========================');
  console.log(insights.summary);
  console.log(insights.documentationPatterns);
  console.log(insights.detailedStats);
  console.log(insights.insights);
  console.log(insights.recommendations);
  console.log('\n📁 Directory Structure');
  console.log('====================');
  console.log(directoryTree);
  
  // Additional output for specific documentation decisions
  const recommendedApproach = stats.docStats.filesWithTypeDoc > (stats.totalFiles * 0.3) 
    ? 'TypeDoc' 
    : (stats.jsdocUsage > stats.tsdocUsage ? 'JSDoc' : 'TypeDoc');
  
  console.log('\n📝 Documentation Strategy Recommendation');
  console.log('=====================================');
  console.log(`Based on the analysis, ${recommendedApproach} would be the most suitable documentation approach for this project.`);
  console.log('Key reasons:');
  
  if (recommendedApproach === 'TypeDoc') {
    console.log('- TypeScript is the primary language in the codebase');
    console.log('- TypeDoc builds on JSDoc by adding TypeScript-specific features');
    console.log('- TypeDoc can generate comprehensive documentation from types and interfaces');
    console.log('- TypeDoc supports markdown in documentation comments');
  } else {
    console.log('- JSDoc patterns are already prevalent in the codebase');
    console.log('- JSDoc has broader tooling support and compatibility');
    console.log('- JSDoc can be used effectively with TypeScript through type annotations');
  }
  
  console.log('\nRecommended next steps:');
  console.log('1. Establish a documentation standard based on this analysis');
  console.log('2. Add the appropriate configuration file (.typedocrc.json or jsdoc.json)');
  console.log('3. Include documentation generation in the build process');
  console.log('4. Consider adding documentation linting to maintain consistency');
}

// Run the script
main().catch(err => {
  console.error('Error running analysis:', err);
  process.exit(1);
});