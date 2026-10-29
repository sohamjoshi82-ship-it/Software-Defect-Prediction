import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // Set CORS headers for cross-origin and preflight requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Parse body if not already parsed by Vercel
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { code, metrics, hotspots, riskLevel, probability } = body;

  if (!code) {
    return res.status(400).json({ error: 'Code content is required' });
  }

  const fallbackHeuristic = {
    success: true,
    mode: 'heuristic',
    summary: `Defect risk evaluated at ${riskLevel || 'Calculated'} (${((probability || 0.5) * 100).toFixed(1)}% probability). Primary drivers: Cyclomatic Complexity = ${metrics?.cyclomaticComplexity || 'N/A'}, Halstead Effort = ${metrics?.halsteadEffort ? metrics.halsteadEffort.toLocaleString() : 'N/A'}.`,
    rootCauses: hotspots && hotspots.length > 0
      ? hotspots.map((h: any) => `${h.metric}: ${h.recommendation}`)
      : [
          'High branch density increases the test state explosion exponentially.',
          'Nested decision structures make code difficult to reason about and maintain.',
          'Consider separating state validation from business calculations.',
        ],
    refactoredCode: `// Recommended Refactoring Pattern:
// 1. Invert nested if-checks into top-level guard clauses
// 2. Extract nested loops or switch blocks into standalone helper functions
// 3. Keep cyclomatic complexity v(G) <= 10 for deterministic unit testing.`,
    qualityChecklist: [
      'Enforce cyclomatic complexity v(G) <= 10 per method in CI/CD linter',
      'Limit nesting depth to maximum 3 indentation levels',
      'Add parameterized unit tests covering all conditional boundary paths',
    ],
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const isRealKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10;

  if (!isRealKey) {
    return res.status(200).json(fallbackHeuristic);
  }

  try {
    const aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are a Principal Software Quality Assurance Engineer and Machine Learning Code Reviewer.
A software module was analyzed using Software Defect Prediction machine learning models.
Here are the empirical software engineering metrics extracted:
- Defect Probability: ${((probability || 0.5) * 100).toFixed(1)}% (${riskLevel || 'Analyzed'} Risk)
- McCabe Cyclomatic Complexity v(G): ${metrics?.cyclomaticComplexity}
- Essential Complexity ev(G): ${metrics?.essentialComplexity}
- Design Complexity iv(G): ${metrics?.designComplexity}
- Halstead Volume: ${metrics?.halsteadVolume}
- Halstead Effort: ${metrics?.halsteadEffort}
- Halstead Estimated Bugs: ${metrics?.halsteadBugs}
- Total LOC: ${metrics?.loc}, Source Lines (SLOC): ${metrics?.sloc}
- Max Nesting Depth: ${metrics?.maxNestingDepth}

Code snippet under inspection:
\`\`\`
${(code || '').slice(0, 3000)}
\`\`\`

Detected Hotspots:
${JSON.stringify(hotspots || [], null, 2)}

Provide an authoritative, actionable software engineering report. Include:
1. Executive Summary of defect risk
2. Top 3 root causes in the code driving the high defect probability
3. Concrete Refactored Code that lowers cyclomatic complexity and Halstead effort
4. Recommended Unit Test Test-Cases to prevent regressions.

Format your response in clear, concise markdown with headings.`;

    const aiPromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI response timed out')), 8000)
    );

    const response = await Promise.race([aiPromise, timeoutPromise]);

    return res.status(200).json({
      success: true,
      mode: 'gemini',
      report: response.text,
    });
  } catch (error: any) {
    console.warn('Vercel serverless Gemini call failed or timed out:', error.message);
    return res.status(200).json(fallbackHeuristic);
  }
}
