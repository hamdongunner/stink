import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { FileClass, FunctionClass, VariableClass } from "./models/models";

// Configuration options for the code analyzer
export interface AnalyzerOptions {
  directory: string;
  include?: string[];
  exclude?: string[];
  minCleanLevel?: number;
  verbose?: boolean;
}

// Analysis results for a single file
interface FileAnalysis {
  file: FileClass;
  functions: FunctionAnalysis[];
  overallCleanLevel: number;
}

// Analysis results for a single function
interface FunctionAnalysis {
  function: FunctionClass;
  variables: VariableClass[];
  cleanLevel: number;
  issues: string[];
}

// Overall analysis results
export interface AnalysisResults {
  files: FileAnalysis[];
  averageCleanLevel: number;
  fileCount: number;
  functionCount: number;
  issueCount: number;
}

// Default analyzer options
const DEFAULT_OPTIONS: AnalyzerOptions = {
  directory: "./src",
  include: ["**/*.ts"],
  exclude: ["**/*.d.ts", "**/node_modules/**", "**/*.spec.ts", "**/*.test.ts"],
  minCleanLevel: 70,
  verbose: false,
};

// Code Quality Analyzer class that handles analyzing TypeScript files
export class CodeQualityAnalyzer {
  private options: AnalyzerOptions;
  private results: AnalysisResults;

  constructor(options: Partial<AnalyzerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.results = {
      files: [],
      averageCleanLevel: 0,
      fileCount: 0,
      functionCount: 0,
      issueCount: 0,
    };
  }

  // Run the analysis on the specified directory
  async analyze(): Promise<AnalysisResults> {
    const tsFiles = this.findTsFiles(this.options.directory);
    this.results.fileCount = tsFiles.length;

    if (this.options.verbose) {
      console.log(`Found ${tsFiles.length} TypeScript files to analyze`);
    }

    let totalCleanLevel = 0;
    let totalIssues = 0;
    let totalFunctions = 0;

    for (const filePath of tsFiles) {
      const analysis = await this.analyzeFile(filePath);
      this.results.files.push(analysis);

      totalCleanLevel += analysis.overallCleanLevel;
      totalFunctions += analysis.functions.length;

      // Count total issues across all functions
      for (const func of analysis.functions) {
        totalIssues += func.issues.length;
      }

      if (this.options.verbose) {
        console.log(
          `Analyzed ${filePath} - Clean Level: ${analysis.overallCleanLevel.toFixed(
            1
          )}`
        );
      }
    }

    // Calculate overall metrics
    this.results.averageCleanLevel =
      totalCleanLevel / Math.max(1, tsFiles.length);
    this.results.functionCount = totalFunctions;
    this.results.issueCount = totalIssues;

    return this.results;
  }

  // Generates a report of the analysis results
  generateReport(): string {
    if (this.results.files.length === 0) {
      return "No analysis has been performed yet. Run analyze() first.";
    }

    let report = "# Code Quality Analysis Report\n\n";

    report += `## Summary\n`;
    report += `- Analyzed ${this.results.fileCount} files\n`;
    report += `- Found ${this.results.functionCount} functions\n`;
    report += `- Detected ${this.results.issueCount} issues\n`;
    report += `- Average Clean Level: ${this.results.averageCleanLevel.toFixed(
      1
    )}/100\n\n`;

    // Sort files by clean level (ascending - worst files first)
    const sortedFiles = [...this.results.files].sort(
      (a, b) => a.overallCleanLevel - b.overallCleanLevel
    );

    report += `## Files Analyzed\n`;
    for (const fileAnalysis of sortedFiles) {
      const filePath = fileAnalysis.file.name;
      const cleanLevel = fileAnalysis.overallCleanLevel.toFixed(1);
      const issueCount = this.countFileIssues(fileAnalysis);

      report += `### ${filePath}\n`;
      report += `- Clean Level: ${cleanLevel}/100\n`;
      report += `- Functions: ${fileAnalysis.functions.length}\n`;
      report += `- Issues: ${issueCount}\n\n`;

      if (issueCount > 0) {
        report += "#### Top Issues:\n";
        const allIssues = this.getAllFileIssues(fileAnalysis);
        // Group similar issues and count them
        const issueGroups = this.groupSimilarIssues(allIssues);

        for (const [issue, count] of Object.entries(issueGroups).slice(0, 5)) {
          report += `- ${issue} (${count} instances)\n`;
        }
        report += "\n";
      }
    }

    return report;
  }

  // Find all TypeScript files in a directory matching include/exclude patterns
  private findTsFiles(directory: string): string[] {
    const files: string[] = [];
    const absoluteDir = path.isAbsolute(directory)
      ? directory
      : path.resolve(process.cwd(), directory);

    if (!fs.existsSync(absoluteDir)) {
      throw new Error(`Directory ${absoluteDir} does not exist`);
    }

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(absoluteDir, fullPath);

        // Skip excluded paths
        if (this.isExcluded(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (
          entry.isFile() &&
          fullPath.endsWith(".ts") &&
          this.isIncluded(relativePath)
        ) {
          files.push(fullPath);
        }
      }
    };

    walk(absoluteDir);
    return files;
  }

  // Check if a file path should be excluded based on patterns
  private isExcluded(filePath: string): boolean {
    if (!this.options.exclude || this.options.exclude.length === 0) {
      return false;
    }

    // Simple pattern matching - can be enhanced with micromatch/minimatch
    return this.options.exclude.some((pattern) => {
      if (pattern.startsWith("**/")) {
        return filePath.includes(pattern.substring(3));
      }
      return filePath === pattern;
    });
  }

  // Check if a file path should be included based on patterns
  private isIncluded(filePath: string): boolean {
    if (!this.options.include || this.options.include.length === 0) {
      return true;
    }

    // Simple pattern matching - can be enhanced with micromatch/minimatch
    return this.options.include.some((pattern) => {
      if (pattern === "**/*.ts") {
        return filePath.endsWith(".ts");
      }
      if (pattern.startsWith("**/")) {
        return filePath.includes(pattern.substring(3));
      }
      return filePath === pattern;
    });
  }

  // Analyze a single TypeScript file
  private async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath);

    // Create FileClass instance
    const fileObj = new FileClass(fileName, fileContent.length, fileContent);

    // Parse TypeScript file to extract functions
    const sourceFile = ts.createSourceFile(
      fileName,
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );

    const functionAnalyses: FunctionAnalysis[] = [];

    // Visit all nodes in the file
    const visitNode = (node: ts.Node) => {
      // Check for function declarations
      if (ts.isFunctionDeclaration(node) && node.name) {
        const functionName = node.name.text;
        const functionText = node.getFullText(sourceFile);

        // Create FunctionClass instance
        const functionObj = new FunctionClass(
          functionName,
          fileObj,
          functionText
        );
        functionObj.calculateStinkLevel();

        // Extract variables from function
        const variables = this.extractVariables(node, functionObj);

        functionAnalyses.push({
          function: functionObj,
          variables,
          cleanLevel: functionObj.getCleanLevel(),
          issues: functionObj.getIssues(),
        });
      }

      // Check for method declarations in classes
      if (ts.isMethodDeclaration(node) && node.name) {
        const methodName = node.name.getText(sourceFile);
        const methodText = node.getFullText(sourceFile);

        // Create FunctionClass instance for the method
        const functionObj = new FunctionClass(methodName, fileObj, methodText);
        functionObj.calculateStinkLevel();

        // Extract variables from method
        const variables = this.extractVariables(node, functionObj);

        functionAnalyses.push({
          function: functionObj,
          variables,
          cleanLevel: functionObj.getCleanLevel(),
          issues: functionObj.getIssues(),
        });
      }

      // Check for arrow functions assigned to variables
      if (
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        ts.isArrowFunction(node.initializer) &&
        node.name
      ) {
        const functionName = node.name.getText(sourceFile);
        const functionText = node.initializer.getFullText(sourceFile);

        // Create FunctionClass instance
        const functionObj = new FunctionClass(
          functionName,
          fileObj,
          functionText
        );
        functionObj.calculateStinkLevel();

        // Extract variables from function
        const variables = this.extractVariables(node.initializer, functionObj);

        functionAnalyses.push({
          function: functionObj,
          variables,
          cleanLevel: functionObj.getCleanLevel(),
          issues: functionObj.getIssues(),
        });
      }

      // Continue traversing
      ts.forEachChild(node, visitNode);
    };

    // Start traversal
    ts.forEachChild(sourceFile, visitNode);

    // Calculate overall clean level for the file
    fileObj.checkDuplicateCode(); // Run duplicate code check
    const fileCleanLevel = fileObj.getCleanLevel();

    // If there are functions, average their clean levels with the file's
    const avgFunctionCleanLevel =
      functionAnalyses.length > 0
        ? functionAnalyses.reduce((sum, f) => sum + f.cleanLevel, 0) /
          functionAnalyses.length
        : 100; // If no functions, assume clean

    // Overall clean level is weighted average of file and function clean levels
    const overallCleanLevel =
      fileCleanLevel * 0.4 + avgFunctionCleanLevel * 0.6;

    return {
      file: fileObj,
      functions: functionAnalyses,
      overallCleanLevel,
    };
  }

  // Extract variables from a function node
  private extractVariables(
    node: ts.Node,
    functionObj: FunctionClass
  ): VariableClass[] {
    const variables: VariableClass[] = [];

    const visitNode = (node: ts.Node) => {
      // Find variable declarations
      if (
        ts.isVariableDeclaration(node) &&
        node.name &&
        ts.isIdentifier(node.name)
      ) {
        const variableName = node.name.text;

        // For simplicity, we'll just use the variable name as the value
        // In a real implementation, you would evaluate the initializer
        const variableValue = node.initializer
          ? node.initializer.getText()
          : "";

        const variableObj = new VariableClass(
          variableName,
          variableValue,
          functionObj
        );
        variables.push(variableObj);
      }

      ts.forEachChild(node, visitNode);
    };

    ts.forEachChild(node, visitNode);
    return variables;
  }

  // Count total issues in a file analysis
  private countFileIssues(fileAnalysis: FileAnalysis): number {
    let issueCount = fileAnalysis.file.getIssues().length;

    for (const func of fileAnalysis.functions) {
      issueCount += func.issues.length;

      for (const variable of func.variables) {
        issueCount += variable.getIssues().length;
      }
    }

    return issueCount;
  }

  // Get all issues from a file analysis
  private getAllFileIssues(fileAnalysis: FileAnalysis): string[] {
    const issues = [...fileAnalysis.file.getIssues()];

    for (const func of fileAnalysis.functions) {
      issues.push(...func.issues);

      for (const variable of func.variables) {
        issues.push(...variable.getIssues());
      }
    }

    return issues;
  }

  // Group similar issues and count occurrences
  private groupSimilarIssues(issues: string[]): Record<string, number> {
    const groups: Record<string, number> = {};

    for (const issue of issues) {
      if (groups[issue]) {
        groups[issue]++;
      } else {
        groups[issue] = 1;
      }
    }

    return groups;
  }
}

// Convenience function to analyze a directory
export async function analyzeDirectory(
  directory: string,
  options: Partial<AnalyzerOptions> = {}
): Promise<AnalysisResults> {
  const analyzer = new CodeQualityAnalyzer({ directory, ...options });
  return await analyzer.analyze();
}

// Convenience function to generate a report for a directory
export async function generateReportForDirectory(
  directory: string,
  options: Partial<AnalyzerOptions> = {}
): Promise<string> {
  const analyzer = new CodeQualityAnalyzer({ directory, ...options });
  await analyzer.analyze();
  return analyzer.generateReport();
}

// Example usage:
/*
async function main() {
  const results = await analyzeDirectory('./src');
  console.log(`Average Clean Level: ${results.averageCleanLevel.toFixed(1)}/100`);
  console.log(`Total Issues: ${results.issueCount}`);
  
  // Generate and save report
  const report = await generateReportForDirectory('./src', { verbose: true });
  fs.writeFileSync('code-quality-report.md', report);
}

main().catch(console.error);
*/
