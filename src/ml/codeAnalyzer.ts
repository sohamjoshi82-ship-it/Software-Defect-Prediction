import type { CodeAnalysisHotspot, CodeMetrics } from './types.ts';

const OPERATORS = new Set([
  '+', '-', '*', '/', '%', '=', '+=', '-=', '*=', '/=', '%=',
  '==', '===', '!=', '!==', '<', '<=', '>', '>=',
  '&&', '||', '!', '&', '|', '^', '~', '<<', '>>', '>>>',
  '++', '--', '?', ':', '->', '.', '::', '(', ')', '[', ']', '{', '}',
  ';', ',', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
  'break', 'continue', 'return', 'try', 'catch', 'throw', 'new', 'sizeof',
  'delete', 'typeof', 'instanceof', 'void', 'const', 'let', 'var', 'function',
  'class', 'import', 'export', 'public', 'private', 'protected', 'static',
]);


export function analyzeSourceCode(code: string): {
  metrics: CodeMetrics;
  hotspots: CodeAnalysisHotspot[];
} {
  const lines = code.split('\n');
  const totalLoc = lines.length;
  let blankLoc = 0;
  let commentLoc = 0;
  let sloc = 0;

  let inBlockComment = false;
  let maxNestingDepth = 0;
  let currentDepth = 0;
  let cyclomaticComplexity = 1; // Base path
  let externalCalls = 0;

  const operatorsCounted: { [op: string]: number } = {};
  const operandsCounted: { [op: string]: number } = {};

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed === '') {
      blankLoc++;
      continue;
    }

    // Check block comments
    if (inBlockComment) {
      commentLoc++;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*')) {
      commentLoc++;
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue;
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      commentLoc++;
      continue;
    }

    sloc++;

    // Track nesting depth
    for (const char of trimmed) {
      if (char === '{' || char === '(') {
        currentDepth++;
        if (currentDepth > maxNestingDepth) {
          maxNestingDepth = currentDepth;
        }
      } else if (char === '}' || char === ')') {
        if (currentDepth > 0) currentDepth--;
      }
    }

    // Tokenize line for Halstead and Cyclomatic
    // Remove string literals to not skew token counts
    const sanitizedLine = trimmed
      .replace(/"(\\.|[^"\\])*"/g, '"str"')
      .replace(/'(\\.|[^'\\])*'/g, "'str'")
      .replace(/`(\\.|[^`\\])*`/g, '`str`');

    // Check cyclomatic branches: control flow keywords
    const keywordMatches = sanitizedLine.match(/\b(if|for|while|catch|case|elif|except|switch)\b/g);
    if (keywordMatches) {
      cyclomaticComplexity += keywordMatches.length;
    }

    // Logical operators that introduce decision paths
    const andMatches = sanitizedLine.match(/(&&|\band\b)/g);
    if (andMatches) {
      cyclomaticComplexity += andMatches.length;
    }

    const orMatches = sanitizedLine.match(/(\|\||\bor\b)/g);
    if (orMatches) {
      cyclomaticComplexity += orMatches.length;
    }

    // Ternary conditional operator
    if (sanitizedLine.includes('?') && sanitizedLine.includes(':')) {
      const ternaryCount = (sanitizedLine.match(/\?/g) || []).length;
      cyclomaticComplexity += ternaryCount;
    }

    // Check function calls (Design Complexity proxy iv(G))
    const callMatches = sanitizedLine.match(/\b[a-zA-Z_]\w*\s*\(/g);
    if (callMatches) {
      externalCalls += callMatches.length;
    }

    // Token split for Halstead
    const tokens = sanitizedLine.match(/[a-zA-Z_]\w*|[0-9]+(\.[0-9]+)?|[+\-*/%=!<>|&^~?:;,\(\)\[\]\{\}]/g) || [];

    for (const token of tokens) {
      if (OPERATORS.has(token) || /^[+\-*/%=!<>|&^~?:;,]+$/.test(token)) {
        operatorsCounted[token] = (operatorsCounted[token] || 0) + 1;
      } else {
        operandsCounted[token] = (operandsCounted[token] || 0) + 1;
      }
    }
  }

  // Calculate Halstead Metrics
  const uniqueOperators = Object.keys(operatorsCounted).length;
  const uniqueOperands = Object.keys(operandsCounted).length;
  const operatorCount = Object.values(operatorsCounted).reduce((a, b) => a + b, 0);
  const operandCount = Object.values(operandsCounted).reduce((a, b) => a + b, 0);

  const halsteadVocabulary = Math.max(1, uniqueOperators + uniqueOperands);
  const halsteadLength = operatorCount + operandCount;

  // Halstead Volume V = N * log2(n)
  const halsteadVolume = halsteadLength * Math.log2(halsteadVocabulary);

  // Halstead Difficulty D = (n1 / 2) * (N2 / n2)
  const halsteadDifficulty =
    uniqueOperands > 0 ? (uniqueOperators / 2) * (operandCount / uniqueOperands) : 1;

  // Halstead Effort E = D * V
  const halsteadEffort = halsteadDifficulty * halsteadVolume;

  // Halstead Time T = E / 18 (in seconds)
  const halsteadTime = halsteadEffort / 18;

  // Halstead Predicted Defects B = V / 3000
  const halsteadBugs = Number((halsteadVolume / 3000).toFixed(3));

  // Essential complexity ev(G) approximates unstructured control flow
  const essentialComplexity = Math.max(1, Math.round(cyclomaticComplexity * 0.65));

  // Design complexity iv(G)
  const designComplexity = Math.max(1, Math.min(cyclomaticComplexity, Math.round(externalCalls * 0.5) + 1));

  const metrics: CodeMetrics = {
    loc: totalLoc,
    sloc,
    commentLoc,
    blankLoc,
    cyclomaticComplexity,
    essentialComplexity,
    designComplexity,
    halsteadLength,
    halsteadVocabulary,
    halsteadVolume: Math.round(halsteadVolume),
    halsteadDifficulty: Number(halsteadDifficulty.toFixed(2)),
    halsteadEffort: Math.round(halsteadEffort),
    halsteadBugs,
    halsteadTime: Math.round(halsteadTime),
    maxNestingDepth,
    branchCount: cyclomaticComplexity - 1,
    operatorCount,
    operandCount,
    uniqueOperators,
    uniqueOperands,
  };

  // Evaluate hotspots based on NASA MDP & IEEE software engineering standards
  const hotspots: CodeAnalysisHotspot[] = [];

  if (cyclomaticComplexity > 10) {
    hotspots.push({
      metric: 'McCabe Cyclomatic Complexity v(G)',
      value: cyclomaticComplexity,
      safeThreshold: 10,
      severity: cyclomaticComplexity > 20 ? 'critical' : 'warning',
      recommendation:
        cyclomaticComplexity > 20
          ? 'Critical high risk! McCabe v(G) exceeds 20. High probability of latent faults. Decompose method into smaller single-responsibility subroutines.'
          : 'High branching complexity (> 10). Extract conditional branches or use polymorphism/strategy patterns.',
    });
  }

  if (maxNestingDepth > 4) {
    hotspots.push({
      metric: 'Maximum Nesting Depth',
      value: maxNestingDepth,
      safeThreshold: 4,
      severity: maxNestingDepth > 6 ? 'critical' : 'warning',
      recommendation:
        'Excessive control flow nesting impedes testability and mental comprehension. Introduce early returns (guard clauses).',
    });
  }

  if (halsteadEffort > 40000) {
    hotspots.push({
      metric: 'Halstead Effort (E)',
      value: Math.round(halsteadEffort),
      safeThreshold: 40000,
      severity: halsteadEffort > 100000 ? 'critical' : 'warning',
      recommendation:
        'High mental cognitive effort required to review or maintain this module. Simplify arithmetic and variable reusing.',
    });
  }

  if (sloc > 80) {
    hotspots.push({
      metric: 'Source Lines of Code (SLOC)',
      value: sloc,
      safeThreshold: 80,
      severity: sloc > 150 ? 'critical' : 'warning',
      recommendation:
        'Module length is excessive for a single function/unit. Refactor into smaller focused units to facilitate unit testing.',
    });
  }

  const commentRatio = sloc > 0 ? commentLoc / sloc : 0;
  if (cyclomaticComplexity > 8 && commentRatio < 0.1) {
    hotspots.push({
      metric: 'Comment-to-Code Ratio',
      value: Number((commentRatio * 100).toFixed(1)),
      safeThreshold: 15,
      severity: 'warning',
      recommendation:
        'Complex logic with under 10% documentation comments increases defect risk during developer maintenance.',
    });
  }

  return { metrics, hotspots };
}
