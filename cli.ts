#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { analyzeDirectory, generateReportForDirectory } from "./index";

// Simple CLI parser
async function main() {
  const args = process.argv.slice(2);
  let directory = "./src";
  let verbose = false;
  let outputFile = "code-quality-report.md";
  let showHelp = false;
  let showReport = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      showHelp = true;
      break;
    } else if (arg === "--verbose" || arg === "-v") {
      verbose = true;
    } else if (arg === "--output" || arg === "-o") {
      if (i + 1 < args.length) {
        outputFile = args[i + 1];
        i++;
      }
    } else if (arg === "--show-report" || arg === "-s") {
      showReport = true;
    } else if (!arg.startsWith("-")) {
      directory = arg;
    }
  }

  if (showHelp) {
    console.log(`
🦨 Code Stink Analyzer - Check your TypeScript code for "stinkiness" 🦨

Usage:
  npx code-stink [options] [directory]

Options:
  -h, --help         Show this help message
  -v, --verbose      Show detailed analysis information
  -o, --output       Specify output report file (default: code-quality-report.md)
  -s, --show-report  Display the full markdown report in the console

Examples:
  npx code-stink ./src
  npx code-stink --verbose ./my-project
  npx code-stink -o report.md ./src
  npx code-stink --show-report ./src
    `);
    return;
  }

  try {
    console.log(`🔍 Analyzing directory: ${directory}`);

    // Run the analysis
    const results = await analyzeDirectory(directory, { verbose });

    // Print summary to console
    console.log("\n🎉 Analysis complete!");
    console.log(`📁 Files analyzed: ${results.fileCount}`);
    console.log(`🧩 Functions found: ${results.functionCount}`);
    console.log(`⚠️ Issues detected: ${results.issueCount}`);
    console.log(
      `💯 Average Clean Level: ${results.averageCleanLevel.toFixed(1)}/100`
    );

    // Generate report
    const report = await generateReportForDirectory(directory, { verbose });

    // Save report to file
    fs.writeFileSync(outputFile, report);
    console.log(`\n📝 Report saved to: ${outputFile}`);

    // Show the full report if requested
    if (showReport) {
      console.log("\n" + "=".repeat(80));
      console.log(`
  ███████  ████████ ██ ███   ██ ██   ██
  ██         ██    ██ ████   ██ ██  ██ 
  ███████    ██    ██ ██ ██  ██ █████  
       ██    ██    ██ ██  ██ ██ ██  ██ 
  ███████    ██    ██ ██   ████ ██   ██
         CODE QUALITY ANALYZER 💩 🦨
`);
      console.log("=".repeat(80) + "\n");
      console.log(report);
    }

    // Provide an interpretation
    if (results.averageCleanLevel > 90) {
      console.log("\n✨ ✅ Your code is very clean! Great job! 🏆");
    } else if (results.averageCleanLevel > 75) {
      console.log(
        "\n👍 ✓ Your code is reasonably clean, with some room for improvement. 🔧"
      );
    } else if (results.averageCleanLevel > 60) {
      console.log(
        "\n🔔 ⚠️ Your code has moderate stink. Consider addressing the top issues. 🧹"
      );
    } else {
      console.log(
        "\n💩 ⛔ Your code has significant stink. Check the report for details. 🧅"
      );
    }
  } catch (error: any) {
    console.error("❌ Error analyzing code:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
