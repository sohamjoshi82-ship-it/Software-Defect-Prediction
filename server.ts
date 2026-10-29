import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// API endpoint for AI-assisted Code Defect Explanation & Refactoring
app.post('/api/gemini/review-defect', async (req, res) => {
  const { code, metrics, hotspots, riskLevel, probability } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code content is required' });
  }

  const fallbackHeuristic = {
    success: true,
    mode: 'heuristic',
    summary: `Defect risk evaluated at ${riskLevel} (${(probability * 100).toFixed(1)}% probability). Primary drivers: Cyclomatic Complexity = ${metrics?.cyclomaticComplexity || 'N/A'}, Halstead Effort = ${metrics?.halsteadEffort ? metrics.halsteadEffort.toLocaleString() : 'N/A'}.`,
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

  const isRealKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10;

  // If no valid AI key configured, provide structured heuristic advice
  if (!aiClient || !isRealKey) {
    return res.json(fallbackHeuristic);
  }

  try {
    const prompt = `You are a Principal Software Quality Assurance Engineer and Machine Learning Code Reviewer.
A software module was analyzed using Software Defect Prediction machine learning models.
Here are the empirical software engineering metrics extracted:
- Defect Probability: ${(probability * 100).toFixed(1)}% (${riskLevel} Risk)
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
${code.slice(0, 3000)}
\`\`\`

Detected Hotspots:
${JSON.stringify(hotspots, null, 2)}

Provide an authoritative, actionable software engineering report. Include:
1. Executive Summary of defect risk
2. Top 3 root causes in the code driving the high defect probability
3. Concrete Refactored Code that lowers cyclomatic complexity and Halstead effort
4. Recommended Unit Test Test-Cases to prevent regressions.

Format your response in clear, concise markdown with headings.`;

    // 8-second timeout race to prevent hanging
    const aiPromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI response timed out')), 8000)
    );

    const response = await Promise.race([aiPromise, timeoutPromise]);

    return res.json({
      success: true,
      mode: 'gemini',
      report: response.text,
    });
  } catch (error: any) {
    console.warn('Gemini API call failed or timed out, returning heuristic report:', error.message);
    return res.json(fallbackHeuristic);
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DefectPredict AI server running on http://localhost:${PORT}`);
  });
}

startServer();
