import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

export function parseFile(code: string, filename?: string) {
  const ext = filename?.split('.').pop()?.toLowerCase();

  if (ext === 'py') {
    return parsePython(code);
  } else if (ext === 'java') {
    return parseJava(code);
  }

  return parseJsTs(code);
}

function parseJsTs(code: string) {
  const imports: string[] = [];
  const routes: string[] = [];
  const functions: {name:string,code:string}[] = []; //changed this

  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    traverse(ast, {
      ImportDeclaration(path) {
        imports.push(path.node.source.value);
      },
      // Named functions
      //Changed this 
      FunctionDeclaration(path) {
        if (path.node.id) {
          functions.push({
            name:path.node.id.name,
            code:code.slice(path.node.start!,path.node.end!)
          })};
      },
      // Arrow functions assigned to variables
      VariableDeclarator(path) {
        if (
          path.node.id.type === "Identifier" &&
          (path.node.init?.type === "ArrowFunctionExpression" ||
            path.node.init?.type === "FunctionExpression")
        ) {
          functions.push({
           name: path.node.id.name,
           code: code.slice(path.node.start!,path.node.end!)
          });
        }
      },
      // Common route patterns (app.get, router.post, etc)
      CallExpression(path) {
        const callee = path.node.callee;
        if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
          const methods = ["get", "post", "put", "delete", "patch"];
          if (methods.includes(callee.property.name)) {
            const firstArg = path.node.arguments[0];
            if (firstArg?.type === "StringLiteral") {
              routes.push(`${callee.property.name.toUpperCase()} ${firstArg.value}`);
            }
          }
        }
      }
    });
  } catch {
    console.log("Parse error (JS/TS)");
  }

  return { 
    imports: Array.from(new Set(imports)), 
    routes: Array.from(new Set(routes)), 
    functions: Array.from(new Map(functions.map(f => [f.name, f])).values()) 
  };
}

function parsePython(code: string) {
  const imports: string[] = [];
  const routes: string[] = [];
  const functions: string[] = [];

  // Imports: import x, from x import y
  const importMatches = code.matchAll(/(?:^|\n)(?:import\s+(\w+)(?:\s+as\s+\w+)?(?:,\s*\w+(?:\s+as\s+\w+)?)*|from\s+([\w.]+)\s+import\s+(?:(?:\w+(?:\s+as\s+\w+)?(?:,\s*\w+(?:\s+as\s+\w+)?)*)|\*))/g);
  for (const match of importMatches) {
    if (match[1]) imports.push(match[1]); // For 'import x'
    if (match[2]) imports.push(match[2]); // For 'from x import y'
  }

  // Functions: def name(...)
  const functionMatches = code.matchAll(/(?:^|\n)\s*def\s+(\w+)\s*\(/g);
  for (const match of functionMatches) {
    functions.push(match[1]);
  }

  // Routes: @app.get('/...') or @app.post('/...') or @app.route('/...')
  const routeMatches = code.matchAll(/@[\w.]+\.(get|post|put|delete|patch|route)\s*\(\s*['"]([^'"]+)['"]/g);
  for (const match of routeMatches) {
    const method = match[1] === 'route' ? 'GET' : match[1].toUpperCase();
    routes.push(`${method} ${match[2]}`);
  }

  return { 
    imports: Array.from(new Set(imports)), 
    routes: Array.from(new Set(routes)), 
    functions: Array.from(new Set(functions)) 
  };
}

function parseJava(code: string) {
  const imports: string[] = [];
  const routes: string[] = [];
  const functions: string[] = [];

  // Imports: import com.package.Class;
  const importMatches = code.matchAll(/(?:^|\n)import\s+([\w.]+)\s*;/g);
  for (const match of importMatches) {
    imports.push(match[1]);
  }

  // Functions: public void name() {
  // This regex tries to capture method names, avoiding keywords like if, for, while, etc.
  // It looks for a word followed by '(', preceded by modifiers and a return type.
  const functionMatches = code.matchAll(/(?:public|protected|private|static|final|abstract|synchronized|native|strictfp|\s)+[\w.<>\[\]]+\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w.,\s]+)?\s*\{?/g);
  for (const match of functionMatches) {
    // Filter out common keywords that might be falsely identified as function names
    if (!['if', 'for', 'while', 'switch', 'try', 'catch', 'finally', 'do', 'class', 'interface', 'enum', 'new', 'return', 'throw', 'super', 'this'].includes(match[1])) {
      functions.push(match[1]);
    }
  }
  

  // Routes: @GetMapping("/...") or @RequestMapping("/...")
  const routeMatches = code.matchAll(/@(Get|Post|Put|Delete|Patch|Request)Mapping\s*(?:\(\s*(?:value\s*=\s*)?["']([^"']+)["'](?:,\s*[\w\s=."']*)?\))?/g);
  for (const match of routeMatches) {
    const method = match[1] === 'Request' ? 'ANY' : match[1].toUpperCase();
    if (match[2]) { // Ensure a path was captured
      routes.push(`${method} ${match[2]}`);
    }
  }

  return { 
    imports: Array.from(new Set(imports)), 
    routes: Array.from(new Set(routes)), 
    functions: Array.from(new Set(functions)) 
  };
}