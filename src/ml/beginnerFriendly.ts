import type { CodeMetrics } from './types.ts';

export interface BeginnerHealthScore {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  readabilityScore: number; // 0 - 100
  testabilityScore: number; // 0 - 100
  riskLevelText: 'Safe & Clean' | 'Low Risk' | 'Needs Attention' | 'High Risk of Bugs' | 'Critical Danger';
  riskColor: string;
  simpleHotspots: {
    title: string;
    description: string;
    simpleFix: string;
    iconType: 'safe' | 'warning' | 'danger';
  }[];
  quickSummary: string;
}

export function computeBeginnerHealthScore(
  probability: number,
  metrics: CodeMetrics
): BeginnerHealthScore {
  // Readability calculation: penalized by nesting depth, LOC, and complex Halstead volume
  let readScore = 100;
  if (metrics.maxNestingDepth > 3) readScore -= (metrics.maxNestingDepth - 3) * 15;
  if (metrics.sloc > 30) readScore -= Math.min(30, (metrics.sloc - 30) * 0.8);
  if (metrics.cyclomaticComplexity > 8) readScore -= (metrics.cyclomaticComplexity - 8) * 4;
  readScore = Math.max(10, Math.min(100, Math.round(readScore)));

  // Testability calculation: heavily penalized by cyclomatic complexity (branch count)
  let testScore = 100;
  if (metrics.cyclomaticComplexity > 5) testScore -= (metrics.cyclomaticComplexity - 5) * 5;
  if (metrics.essentialComplexity > 3) testScore -= (metrics.essentialComplexity - 3) * 6;
  if (metrics.maxNestingDepth > 4) testScore -= 15;
  testScore = Math.max(10, Math.min(100, Math.round(testScore)));

  // Combined Grade
  const avg = (readScore + testScore) / 2;
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A+';
  if (avg >= 92 && probability < 0.2) grade = 'A+';
  else if (avg >= 80 && probability < 0.35) grade = 'A';
  else if (avg >= 65 && probability < 0.5) grade = 'B';
  else if (avg >= 50 && probability < 0.65) grade = 'C';
  else if (avg >= 35) grade = 'D';
  else grade = 'F';

  let riskLevelText: 'Safe & Clean' | 'Low Risk' | 'Needs Attention' | 'High Risk of Bugs' | 'Critical Danger' = 'Safe & Clean';
  let riskColor = 'text-emerald-400';

  if (probability >= 0.75) {
    riskLevelText = 'Critical Danger';
    riskColor = 'text-rose-400';
  } else if (probability >= 0.55) {
    riskLevelText = 'High Risk of Bugs';
    riskColor = 'text-rose-300';
  } else if (probability >= 0.35) {
    riskLevelText = 'Needs Attention';
    riskColor = 'text-amber-400';
  } else if (probability >= 0.2) {
    riskLevelText = 'Low Risk';
    riskColor = 'text-cyan-400';
  }

  const simpleHotspots: {
    title: string;
    description: string;
    simpleFix: string;
    iconType: 'safe' | 'warning' | 'danger';
  }[] = [];

  if (metrics.cyclomaticComplexity > 10) {
    simpleHotspots.push({
      title: `Too Many Forks in the Road (${metrics.cyclomaticComplexity} branches)`,
      description: `Think of code branches like highway forks. Your code has ${metrics.cyclomaticComplexity} paths, which makes it very easy for a programmer to overlook a case.`,
      simpleFix: 'Split big if/else blocks into smaller helper functions.',
      iconType: 'danger',
    });
  }

  if (metrics.maxNestingDepth > 3) {
    simpleHotspots.push({
      title: `Nested Like Russian Dolls (${metrics.maxNestingDepth} levels deep)`,
      description: 'Having if-statements inside if-statements inside loops makes code hard for humans to keep in their head.',
      simpleFix: 'Use "guard clauses" (return early if something is invalid, instead of indenting everything).',
      iconType: 'warning',
    });
  }

  if (metrics.sloc > 50) {
    simpleHotspots.push({
      title: `Function is Too Long (${metrics.sloc} lines)`,
      description: 'Long functions tend to do too many unrelated jobs at once.',
      simpleFix: 'Aim for functions under 25-30 lines that do exactly one task well.',
      iconType: 'warning',
    });
  }

  if (simpleHotspots.length === 0) {
    simpleHotspots.push({
      title: 'Clean & Easy to Maintain!',
      description: 'Your code is concise, has clear branching logic, and minimal nesting.',
      simpleFix: 'Keep writing simple, single-purpose functions with automated tests.',
      iconType: 'safe',
    });
  }

  const quickSummary =
    probability > 0.5
      ? `This code has a ${(probability * 100).toFixed(0)}% chance of causing bugs. The main culprit is complicated branching and deep nesting. Simplification recommended before testing.`
      : `Looking good! Bug probability is low (${(probability * 100).toFixed(0)}%). The logic is straightforward and easy to test.`;

  return {
    grade,
    readabilityScore: readScore,
    testabilityScore: testScore,
    riskLevelText,
    riskColor,
    simpleHotspots,
    quickSummary,
  };
}

export const BEGINNER_METRIC_GLOSSARY: Record<string, { plainName: string; simpleExplanation: string; analogy: string }> = {
  v_g: {
    plainName: 'Branching Complexity',
    simpleExplanation: 'Counts how many decision points (if, while, for, switch) exist.',
    analogy: 'Like forks in a maze: more forks mean it is easier to get lost and harder to test every exit.',
  },
  cyclomaticComplexity: {
    plainName: 'Branching Complexity (McCabe)',
    simpleExplanation: 'Counts how many decision paths exist through the function.',
    analogy: 'Safe highway is 1-5 branches. An overwhelming maze is 15+ branches.',
  },
  maxNestingDepth: {
    plainName: 'Indentation / Nesting Depth',
    simpleExplanation: 'How deep brackets or tabs are stacked inside each other.',
    analogy: 'Russian nesting dolls: 2 levels is fine, 5 levels is a headache to debug.',
  },
  halsteadVolume: {
    plainName: 'Code Mental Weight (Volume)',
    simpleExplanation: 'A formula measuring how many different words and symbols the brain must juggle.',
    analogy: 'Reading a children\'s book vs reading legal tax documents.',
  },
  halsteadEffort: {
    plainName: 'Mental Effort to Review',
    simpleExplanation: 'Estimated mental cognitive energy required to inspect or modify the code without making mistakes.',
    analogy: 'Higher effort means developers get fatigued and introduce bugs during late-night edits.',
  },
  halsteadBugs: {
    plainName: 'Predicted Bug Count',
    simpleExplanation: 'Scientifically estimated number of latent defects based on code size and complexity.',
    analogy: 'Empirical formula: for every 3,000 units of mental volume, 1 bug usually hides.',
  },
  sloc: {
    plainName: 'Active Code Lines',
    simpleExplanation: 'Real lines of executable code (excluding blank lines and comments).',
    analogy: 'Shorter functions are easier to test and harder to break.',
  },
  rocAuc: {
    plainName: 'AI Accuracy Rating (AUC)',
    simpleExplanation: 'How reliably the machine learning model tells buggy modules apart from healthy modules (1.00 is perfect).',
    analogy: 'Like a medical test accuracy score: 0.95+ means 95%+ trustworthy diagnosis.',
  },
  smote: {
    plainName: 'Automatic Bug Balancer',
    simpleExplanation: 'In real software, only 15% of files have bugs. The balancer teaches the AI to spot rare bugs instead of ignoring them.',
    analogy: 'Like giving a student extra practice on the tricky questions so they don\'t only guess the easy ones.',
  },
};
