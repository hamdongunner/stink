# Code Stink Analyzer

A TypeScript code quality analyzer that measures the "stinkiness" of your code by checking various clean code metrics.

## Features

- Analyzes TypeScript files for code quality issues
- Detects common "code smells" including:
  - Functions that are too long
  - Functions with too many parameters
  - Functions with too many code blocks
  - Non-descriptive function and variable names
  - Mixed levels of abstraction
  - Use of boolean parameters
  - Use of global variables
  - Mutable object modifications
  - Complex conditions without encapsulation
  - Negative conditionals
  - Duplicate code blocks
- Generates a comprehensive Markdown report
- Provides an overall "Clean Level" score (0-100)

## Installation

### As a development dependency in your project

```bash
npm install --save-dev code-stink
```

### Global installation

```bash
npm install -g code-stink
```

## Usage

### Command Line

```bash
# Analyze the current project's src directory
code-stink ./src

# Show detailed analysis information
code-stink --verbose ./my-project

# Specify a custom output report file
code-stink -o report.md ./src

# Display the full report in the console
code-stink --show-report ./src

# Combine options as needed
code-stink --verbose --show-report -o detailed-report.md ./src
```

### CLI Options

| Option          | Short | Description                                                  |
| --------------- | ----- | ------------------------------------------------------------ |
| `--help`        | `-h`  | Show help message                                            |
| `--verbose`     | `-v`  | Show detailed analysis information during processing         |
| `--output`      | `-o`  | Specify output report file (default: code-quality-report.md) |
| `--show-report` | `-s`  | Display the full markdown report in the console              |

### Programmatic Usage

```typescript
import { analyzeDirectory, generateReportForDirectory } from "code-stink";

async function analyzeMyCode() {
  // Just get the analysis results
  const results = await analyzeDirectory("./src", { verbose: true });
  console.log(
    `Average Clean Level: ${results.averageCleanLevel.toFixed(1)}/100`
  );

  // Or generate a full report
  const report = await generateReportForDirectory("./src");
  console.log(report);
}

analyzeMyCode().catch(console.error);
```

## Clean Code Metrics

The analyzer checks for the following issues:

### Function Level

- **Function Length**: Functions should not exceed 10 lines
- **Function Blocks**: Functions should not have more than 10 code blocks
- **Parameters**: Functions should have 3 or fewer parameters
- **Naming**: Functions should use camelCase, start with an action verb, and be descriptive
- **Abstraction Level**: Functions should maintain a consistent level of abstraction
- **Boolean Parameters**: Functions should avoid boolean parameters
- **Global Variables**: Functions should avoid using global variables
- **Mutable Objects**: Functions should create copies before modifying objects
- **Conditions**: Complex conditions should be encapsulated
- **Negative Conditionals**: Code should prefer positive conditionals over negative ones

### Variable Level

- **Naming**: Variables should be descriptive and use camelCase
- **Type Consistency**: Variable names should match their actual types

### File Level

- **Duplicate Code**: Files should not contain duplicate code blocks

## Clean Level Score

The analyzer calculates a "Clean Level" score (0-100) for each function, variable, and file:

- **90-100**: Very clean code, follows best practices
- **75-89**: Reasonably clean code with minor issues
- **60-74**: Moderately stinky code with several issues to address
- **0-59**: Significantly stinky code requiring major refactoring

## License

MIT
