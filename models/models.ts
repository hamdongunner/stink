import * as ts from "typescript";

class FileClass {
  private stinkLevel: number = 0;
  private issues: string[] = [];
  private DUPLICATE_CODE_DEDUCTION = 15;
  private MIN_DUPLICATE_LENGTH = 5; // Minimum number of lines to consider as duplication

  constructor(public name: string, public size: number, public code: string) {}

  /**
   * Checks if there are duplicate code blocks in the file
   * @returns boolean indicating if duplicates were found
   */
  checkDuplicateCode(): boolean {
    const lines = this.code.split("\n");
    const duplicates: Set<string> = new Set();

    // Look for duplicate blocks with minimum length
    for (let i = 0; i <= lines.length - this.MIN_DUPLICATE_LENGTH; i++) {
      const blockToCheck = lines
        .slice(i, i + this.MIN_DUPLICATE_LENGTH)
        .join("\n");

      // Skip blocks that are just whitespace or very simple
      if (blockToCheck.trim().length < 20) continue;

      // Look for this block elsewhere in the file
      for (
        let j = i + this.MIN_DUPLICATE_LENGTH;
        j <= lines.length - this.MIN_DUPLICATE_LENGTH;
        j++
      ) {
        const compareBlock = lines
          .slice(j, j + this.MIN_DUPLICATE_LENGTH)
          .join("\n");
        if (blockToCheck === compareBlock) {
          duplicates.add(blockToCheck);
          this.stinkLevel += this.DUPLICATE_CODE_DEDUCTION;
          this.issues.push(
            `Duplicate code block found at lines ${i + 1}-${
              i + this.MIN_DUPLICATE_LENGTH
            } and ${j + 1}-${j + this.MIN_DUPLICATE_LENGTH}`
          );
          break; // Found a duplicate, move to next block
        }
      }
    }

    return duplicates.size > 0;
  }

  /**
   * Gets the overall clean level of the file (0-100)
   * 0 = extremely stinky, 100 = perfectly clean
   * @returns number representing clean level
   */
  getCleanLevel(): number {
    // Check for issues before calculating
    this.checkDuplicateCode();

    // Base score starts at 100, deduct based on stink level
    const baseScore = 100;
    const score = Math.max(0, baseScore - this.stinkLevel);

    return score;
  }

  /**
   * Returns all identified issues in the file
   * @returns string[] of issues
   */
  getIssues(): string[] {
    return this.issues;
  }
}

class FunctionClass {
  private stinkLevel: number = 0;
  private issues: string[] = [];
  private MAX_LINES = 10;
  private MAX_LINES_VIOLATION_DEDUCTION = 10;
  private MAX_BLOCKS = 10;
  private MAX_BLOCKS_VIOLATION_DEDUCTION = 10;
  private MAX_PARAMETERS = 3;
  private MAX_PARAMETERS_VIOLATION_DEDUCTION = 5;
  private FUNCTION_NAME_VIOLATION_DEDUCTION = 10;
  private ABSTRACTION_LEVEL_VIOLATION_DEDUCTION = 15;
  private BOOLEAN_PARAMETER_DEDUCTION = 5;
  private GLOBAL_VARIABLE_DEDUCTION = 10;
  private MUTABLE_OBJECT_DEDUCTION = 8;
  private UNENCAPSULATED_CONDITION_DEDUCTION = 5;
  private NEGATIVE_CONDITIONAL_DEDUCTION = 3;

  private ACCEPTABLE_VERBS = [
    "get",
    "set",
    "fetch",
    "calculate",
    "update",
    "delete",
    "generate",
    "create",
    "filter",
    "handle",
    "process",
    "validate",
    "convert",
    "find",
    "remove",
    "add",
    "save",
    "load",
  ];
  private hasHighLevelAbstraction = false;
  private hasLowLevelAbstraction = false;
  private globalVariables: Set<string> = new Set(); // Track global variables

  constructor(
    public name: string,
    public codeFile: FileClass,
    public functionCode: string
  ) {}

  calculateStinkLevel(): number {
    this.checkNumberOfLines(this.functionCode);
    this.checkNumberOfBlocks(this.functionCode);
    this.checkNumberOfParameters(this.functionCode);
    this.checkName(this.name);
    this.checkAbstractionLevel(this.functionCode);
    this.checkBooleanParameters(this.functionCode);
    this.checkGlobalVariables(this.functionCode);
    this.checkMutableObjects(this.functionCode);
    this.checkConditionEncapsulation(this.functionCode);
    this.checkNegativeConditionals(this.functionCode);

    return this.stinkLevel;
  }

  getStinkLevel(): number {
    return this.stinkLevel;
  }

  getIssues(): string[] {
    return this.issues;
  }

  /**
   * Gets the clean level (0-100) with 100 being perfectly clean
   * @returns number representing clean level
   */
  getCleanLevel(): number {
    // Calculate stink level if not already done
    if (this.stinkLevel === 0 && this.issues.length === 0) {
      this.calculateStinkLevel();
    }

    // Base score starts at 100, deduct based on stink level
    const baseScore = 100;
    const score = Math.max(0, baseScore - this.stinkLevel);

    return score;
  }

  checkNumberOfLines(functionCode: string): void {
    const lines = functionCode.split("\n").length;
    if (lines > this.MAX_LINES) {
      this.stinkLevel += this.MAX_LINES_VIOLATION_DEDUCTION;
      this.issues.push(
        `Function ${this.name} has ${lines} lines (maximum recommended: ${this.MAX_LINES})`
      );
    }
  }

  checkNumberOfBlocks(functionCode: string): void {
    const blocks = functionCode.split("{").length - 1;
    if (blocks > this.MAX_BLOCKS) {
      this.stinkLevel +=
        (blocks - this.MAX_BLOCKS) * this.MAX_BLOCKS_VIOLATION_DEDUCTION;
      this.issues.push(
        `Function ${this.name} has ${blocks} code blocks (maximum recommended: ${this.MAX_BLOCKS})`
      );
    }
  }

  checkNumberOfParameters(functionCode: string): void {
    // Improved parameter counting using regex
    const parameterMatch = functionCode.match(/\(([^)]*)\)/);

    if (!parameterMatch) return;

    const paramText = parameterMatch[1].trim();
    const parameters = paramText ? paramText.split(",").length : 0;

    if (parameters > this.MAX_PARAMETERS) {
      this.stinkLevel +=
        (parameters - this.MAX_PARAMETERS) *
        this.MAX_PARAMETERS_VIOLATION_DEDUCTION;
      this.issues.push(
        `Function ${this.name} has ${parameters} parameters (maximum recommended: ${this.MAX_PARAMETERS})`
      );
    }
  }

  checkName(name: string): void {
    const words = this.splitCamelCase(name);

    if (!this.isCamelCase(name)) {
      this.stinkLevel += this.FUNCTION_NAME_VIOLATION_DEDUCTION;
      this.issues.push(
        `Function '${this.name}' is not using camelCase naming convention`
      );
    }

    if (words.length > 0 && !this.hasValidVerb(words[0])) {
      this.stinkLevel += this.FUNCTION_NAME_VIOLATION_DEDUCTION;
      this.issues.push(
        `Function '${this.name}' doesn't start with a valid action verb`
      );
    }

    if (!this.hasDescriptiveParts(words)) {
      this.stinkLevel += this.FUNCTION_NAME_VIOLATION_DEDUCTION;
      this.issues.push(`Function '${this.name}' lacks descriptive naming`);
    }
  }

  checkAbstractionLevel(functionCode: string): void {
    // Parse the function code into a TypeScript AST
    const sourceFile = ts.createSourceFile(
      "temp.ts",
      functionCode,
      ts.ScriptTarget.Latest,
      true
    );

    // Reset abstraction flags
    this.hasHighLevelAbstraction = false;
    this.hasLowLevelAbstraction = false;

    // Traverse the AST and analyze the function's body
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
        if (node.body) {
          ts.forEachChild(node.body, this.checkNode.bind(this));
        }
      }
    });

    // If both levels are present, deduct points and add issue
    if (this.hasHighLevelAbstraction && this.hasLowLevelAbstraction) {
      this.stinkLevel += this.ABSTRACTION_LEVEL_VIOLATION_DEDUCTION;
      this.issues.push(
        `Function ${this.name} mixes different levels of abstraction`
      );
    }
  }

  /**
   * Checks if the function has boolean parameters
   * @param functionCode The function code to analyze
   */
  checkBooleanParameters(functionCode: string): void {
    const booleanRegex = /\(([^)]*bool[^)]*)\)/i;
    const match = functionCode.match(booleanRegex);

    if (match) {
      this.stinkLevel += this.BOOLEAN_PARAMETER_DEDUCTION;
      this.issues.push(
        `Function ${this.name} uses boolean parameters which reduce readability`
      );
    }
  }

  /**
   * Checks if the function uses global variables
   * @param functionCode The function code to analyze
   */
  checkGlobalVariables(functionCode: string): void {
    // Create AST to properly analyze global variables
    const sourceFile = ts.createSourceFile(
      "temp.ts",
      functionCode,
      ts.ScriptTarget.Latest,
      true
    );

    // Clear previous globals
    this.globalVariables.clear();

    // Analyze the AST for global variable usage
    const identifiers: string[] = [];
    const visitor = (node: ts.Node) => {
      if (ts.isIdentifier(node)) {
        identifiers.push(node.text);
      }
      ts.forEachChild(node, visitor);
    };

    ts.forEachChild(sourceFile, visitor);

    // Check for common global objects
    const commonGlobals = ["window", "document", "console", "localStorage"];
    const foundGlobals = identifiers.filter((id) => commonGlobals.includes(id));

    if (foundGlobals.length > 0) {
      this.stinkLevel += this.GLOBAL_VARIABLE_DEDUCTION;
      this.issues.push(
        `Function ${this.name} uses global variables: ${foundGlobals.join(
          ", "
        )}`
      );
    }
  }

  /**
   * Checks if the function updates objects without cloning them
   * @param functionCode The function code to analyze
   */
  checkMutableObjects(functionCode: string): void {
    // Check for direct property assignments without object spread/clone
    const directAssignmentRegex = /(\w+)\.(\w+)\s*=\s*/g;
    let match;
    const matches: RegExpExecArray[] = [];

    // Collect matches safely without using matchAll iterator
    while ((match = directAssignmentRegex.exec(functionCode)) !== null) {
      matches.push(match);
    }

    if (matches.length > 0) {
      // Check if there are any object.assign or spread operators
      const hasCloning = /Object\.assign|\.\.\./.test(functionCode);

      if (!hasCloning && matches.length > 1) {
        this.stinkLevel += this.MUTABLE_OBJECT_DEDUCTION;
        this.issues.push(
          `Function ${this.name} modifies objects without cloning them first`
        );
      }
    }
  }

  /**
   * Checks if conditions are properly encapsulated
   * @param functionCode The function code to analyze
   */
  checkConditionEncapsulation(functionCode: string): void {
    // Look for complex conditions
    const complexConditionRegex = /if\s*\(\s*.+&&.+\|\|.+.+\)/g;
    const matches = functionCode.match(complexConditionRegex);

    if (matches && matches.length > 0) {
      this.stinkLevel +=
        matches.length * this.UNENCAPSULATED_CONDITION_DEDUCTION;
      this.issues.push(
        `Function ${this.name} has ${matches.length} complex conditions that should be encapsulated`
      );
    }
  }

  /**
   * Checks if the function uses negative conditionals
   * @param functionCode The function code to analyze
   */
  checkNegativeConditionals(functionCode: string): void {
    // Look for negative conditionals (!=, !==, !condition)
    const negativeConditionalRegex = /if\s*\(\s*!|\!\=|\!\=\=/g;
    const matches = functionCode.match(negativeConditionalRegex);

    if (matches && matches.length > 0) {
      this.stinkLevel += matches.length * this.NEGATIVE_CONDITIONAL_DEDUCTION;
      this.issues.push(
        `Function ${this.name} uses ${matches.length} negative conditionals, prefer positive conditions`
      );
    }
  }

  // Private methods
  private isCamelCase(str: string): boolean {
    const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/;
    return camelCaseRegex.test(str);
  }

  private splitCamelCase(str: string): string[] {
    return str.split(/(?=[A-Z])/);
  }

  private hasValidVerb(word: string): boolean {
    return this.ACCEPTABLE_VERBS.includes(word.toLowerCase());
  }

  private hasDescriptiveParts(words: string[]): boolean {
    return words.length > 1 && words.every((word) => word.length > 1);
  }

  private checkNode(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      // High-level abstraction: Calling another function
      this.hasHighLevelAbstraction = true;
    } else if (
      ts.isVariableStatement(node) || // `let x = 10;`
      ts.isExpressionStatement(node) // Inline expressions like `console.log(x);`
    ) {
      // Low-level abstraction: Direct operations
      this.hasLowLevelAbstraction = true;
    }

    // Stop traversing further if both levels are found
    if (this.hasHighLevelAbstraction && this.hasLowLevelAbstraction) {
      return;
    }

    // Recursively check child nodes
    ts.forEachChild(node, this.checkNode.bind(this));
  }
}

// Define custom type aliases for variable types
type CustomType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "function"
  | "map"
  | "set";

interface TypeMarkers {
  [key: string]: CustomType;
}

class VariableClass {
  private stinkLevel: number = 0;
  private issues: string[] = [];
  private DESCRIPTIVE_NAME_VIOLATION_DEDUCTION = 10;
  private TYPE_MISMATCH_DEDUCTION = 15;
  private VARIABLE_TYPE_MARKERS: TypeMarkers = {
    is: "boolean",
    has: "boolean",
    count: "number",
    index: "number",
    num: "number",
    str: "string",
    arr: "array",
    obj: "object",
    map: "map",
    set: "set",
    fn: "function",
  };

  constructor(
    public name: string,
    public value: any,
    public functionClass: FunctionClass
  ) {}

  /**
   * Checks if the variable name is descriptive enough
   * @returns boolean indicating if the name is descriptive
   */
  checkDescriptiveName(): boolean {
    // Variables should be at least 2 characters
    if (this.name.length < 2) {
      this.stinkLevel += this.DESCRIPTIVE_NAME_VIOLATION_DEDUCTION;
      this.issues.push(
        `Variable '${this.name}' is too short to be descriptive`
      );
      return false;
    }

    // Check for single letter variables (except for common cases like i, j in loops)
    if (
      this.name.length === 1 &&
      !["i", "j", "k", "x", "y", "z"].includes(this.name)
    ) {
      this.stinkLevel += this.DESCRIPTIVE_NAME_VIOLATION_DEDUCTION;
      this.issues.push(
        `Variable '${this.name}' uses non-standard single letter naming`
      );
      return false;
    }

    // Check if it's using camelCase
    const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/;
    if (!camelCaseRegex.test(this.name)) {
      this.stinkLevel += this.DESCRIPTIVE_NAME_VIOLATION_DEDUCTION;
      this.issues.push(`Variable '${this.name}' should use camelCase naming`);
      return false;
    }

    return true;
  }

  /**
   * Checks if the variable name has prefix/suffix that indicates type
   * but the actual value doesn't match that type
   * @returns boolean indicating if there's a type mismatch
   */
  checkTypeConsistency(): boolean {
    // Extract possible type indicators from the name
    for (const [marker, expectedType] of Object.entries(
      this.VARIABLE_TYPE_MARKERS
    )) {
      if (
        (this.name.startsWith(marker) && marker.length < this.name.length) ||
        (this.name.endsWith(marker) && marker.length < this.name.length)
      ) {
        // Determine actual type of the value
        let actualType: CustomType = "string";

        // Get the actual type
        if (typeof this.value === "string") actualType = "string";
        else if (typeof this.value === "number") actualType = "number";
        else if (typeof this.value === "boolean") actualType = "boolean";
        else if (typeof this.value === "function") actualType = "function";
        else if (Array.isArray(this.value)) actualType = "array";
        else if (this.value && typeof this.value === "object") {
          if (this.value.constructor === Map) actualType = "map";
          else if (this.value.constructor === Set) actualType = "set";
          else actualType = "object";
        }

        // Check for type mismatch
        if (actualType !== expectedType) {
          this.stinkLevel += this.TYPE_MISMATCH_DEDUCTION;
          this.issues.push(
            `Variable '${this.name}' implies type '${expectedType}' but contains a value of type '${actualType}'`
          );
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Gets the stink level of the variable (higher = worse)
   * @returns number representing stink level
   */
  getStinkLevel(): number {
    // Run checks if not already done
    if (this.stinkLevel === 0) {
      this.checkDescriptiveName();
      this.checkTypeConsistency();
    }

    return this.stinkLevel;
  }

  /**
   * Gets the issues found with this variable
   * @returns string[] of issues
   */
  getIssues(): string[] {
    return this.issues;
  }

  /**
   * Gets the clean level (0-100) with 100 being perfectly clean
   * @returns number representing clean level
   */
  getCleanLevel(): number {
    // Calculate stink level if not already done
    if (this.stinkLevel === 0) {
      this.getStinkLevel();
    }

    // Base score starts at 100, deduct based on stink level
    const baseScore = 100;
    const score = Math.max(0, baseScore - this.stinkLevel);

    return score;
  }
}

export { FileClass, FunctionClass, VariableClass };
