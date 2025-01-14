import * as ts from "typescript";

class FileClass {
  constructor(public name: string, public size: number, public code: string) {}
  // function to check if there are duplicate code in the file
  // function to get the file clean level
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

  // 3. Constructor
  constructor(
    public name: string,
    public codeFile: FileClass,
    public functionCode: string
  ) {}

  calculateStinkLevel() {
    this.checkNumberOfLines(this.functionCode);
    this.checkNumberOfBlocks(this.functionCode);
    this.checkNumberOfParameters(this.functionCode);
    this.checkName(this.name);
    this.checkAbstractionLevel(this.functionCode);
  }

  getStinkLevel() {
    return this.stinkLevel;
  }

  getIssues() {
    return this.issues;
  }

  checkNumberOfLines(functionCode: string) {
    const lines = functionCode.split("\n").length;
    if (lines > this.MAX_LINES) {
      this.stinkLevel += this.MAX_LINES_VIOLATION_DEDUCTION;
      this.issues.push(
        `Function ${this.name} has more than ${this.MAX_LINES} lines`
      );
    }
  }

  checkNumberOfBlocks(functionCode: string) {
    const blocks = functionCode.split("{").length - 1;
    if (blocks > this.MAX_BLOCKS) {
      this.stinkLevel += blocks * this.MAX_BLOCKS_VIOLATION_DEDUCTION;
      this.issues.push(
        `Function ${this.name} has more than ${this.MAX_BLOCKS} blocks`
      );
    }
  }

  checkNumberOfParameters(functionCode: string) {
    const parameters = functionCode
      .split("(")[1]
      .split(")")[0]
      .split(",").length;
    if (parameters > this.MAX_PARAMETERS) {
      this.stinkLevel += parameters * this.MAX_PARAMETERS_VIOLATION_DEDUCTION;
      this.issues.push(
        `Function ${this.name} has more than ${this.MAX_PARAMETERS} parameters`
      );
    }
  }

  checkName(name: string) {
    const words = this.splitCamelCase(name);
    if (!this.isCamelCase(name))
      this.stinkLevel += this.FUNCTION_NAME_VIOLATION_DEDUCTION;
    this.issues.push(`Function ${this.name} is not camel case`);

    if (!this.hasValidVerb(words[0]))
      this.stinkLevel += this.FUNCTION_NAME_VIOLATION_DEDUCTION;
    this.issues.push(`Function ${this.name} has invalid verb`);

    if (!this.hasDescriptiveParts(words))
      this.stinkLevel += this.FUNCTION_NAME_VIOLATION_DEDUCTION;
    this.issues.push(`Function ${this.name} is not descriptive`);
  }

  checkAbstractionLevel(functionCode: string) {
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

  // function to check if the function have boolean parameters arguments
  // function to check if the function is using global variable
  // function to check if the function is updating an object without cloning it
  // function to check if the conditions are not encapsulated
  // function to check it the function have negative conditionals
  // function to get the function clean level

  // 5. Private methods
  private isCamelCase(str: string) {
    const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/;
    return camelCaseRegex.test(str);
  }

  private splitCamelCase(str: string) {
    return str.split(/(?=[A-Z])/);
  }

  private hasValidVerb(word: string) {
    return this.ACCEPTABLE_VERBS.includes(word.toLowerCase());
  }

  private hasDescriptiveParts(words) {
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

class VariableClass {
  constructor(
    public name: string,
    public value: string,
    public functionClass: FunctionClass
  ) {}
  // function to check if the variable name is not descriptive
  // function to check if the variable name contains different type of the variable
}

// let functionTextMixedAbstractionLevels = `
// function calculateDiscountedCartTotal(cartItems: CartItem[], discountCode: string): number {
//     // Low-level abstraction: Summing total cost manually
//     let total = 0;
//     for (const item of cartItems) {
//         total += item.price * item.quantity;
//     }

//     // High-level abstraction: Business logic for discounts
//     const discountRules: Record<string, (total: number) => number> = {
//         SUMMER10: (total) => total * 0.9, // 10% discount
//         WINTER15: (total) => total * 0.85, // 15% discount
//         NONE: (total) => total,           // No discount
//     };

//     const applyDiscount = discountRules[discountCode] || discountRules["NONE"];

//     // High-level abstraction: Applying discount
//     return applyDiscount(total);
// }
// `;

// test the function
// const functionClass = new FunctionClass(
//   "calculateDiscountedCartTotal",
//   new FileClass("test.ts", 100, ""),
//   functionTextMixedAbstractionLevels
// );
// functionClass.calculateStinkLevel();
// console.log(functionClass.getStinkLevel());
// console.log(functionClass.getIssues());
