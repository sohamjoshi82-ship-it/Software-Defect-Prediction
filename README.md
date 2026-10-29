# DefectPredict AI — Software Defect Prediction via Machine Learning

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Ready-black?style=flat&logo=vercel)](https://vercel.com)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

**DefectPredict AI** is an empirical Software Quality Assurance platform powered by Machine Learning and Static Code Analysis. It predicts software defect probability and bug hotspots in real-time before code is committed to production.

---

## ⚡ 1-Click Deployment to Vercel

DefectPredict AI is pre-configured for instant zero-configuration deployment to **Vercel**:

### Option A: Via Vercel Web Dashboard (Easiest)
1. Push this repository to GitHub or GitLab.
2. Go to [vercel.com](https://vercel.com) and click **"Add New..." &rarr; "Project"**.
3. Import your repository. Vercel automatically detects the **Vite** framework.
4. *(Optional)* Add `GEMINI_API_KEY` in Environment Variables if you want Gemini AI LLM code refactoring. (If omitted, high-precision deterministic heuristic QA diagnostics run automatically!).
5. Click **Deploy**. Done!

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

`vercel.json` and the serverless API function `/api/gemini/review-defect.ts` are already configured with CORS and automatic fallbacks.

---

## 🚀 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Run unit tests:**
   ```bash
   npm test
   # or: node --test src/ml/models.test.ts
   ```

4. **Production Build:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🧠 Core Features & Architecture

- **100% Client-Side Machine Learning**:
  - Implements Random Forest, Gaussian Naive Bayes, Logistic Regression, and Decision Trees from first principles.
  - Features SMOTE (Synthetic Minority Over-sampling Technique) to balance defect classes.
  - Zero external Python server requirement; models train and infer in milliseconds directly in the browser!

- **Empirical Software Quality Metrics**:
  - **McCabe Cyclomatic Complexity $v(G)$**, Essential Complexity $ev(G)$, Design Complexity $iv(G)$.
  - **Halstead Complexity Metrics**: Vocabulary ($\eta$), Length ($N$), Volume ($V$), Difficulty ($D$), Effort ($E$), and Estimated Delivered Bugs ($B$).
  - **Chidamber & Kemerer (CK) Object-Oriented Metrics**: WMC, DIT, RFC, CBO, LCOM.

- **Interactive Sci-Fi Visualizations**:
  - **Interactive Control Flow Graph (CFG)**: Animated SVG particle execution paths illustrating decision branches and cyclomatic risk nodes.
  - **Cyber Radar Canvas**: 3 tactical modes: 360° Tactical Sweep, 3D Orbital Constellation, and Phase-Space Scatter.
  - **Neural Training Matrix HUD**: Real-time animated loss curves, decision boundary contours, and confusion matrix heatmaps.
  - **Interactive Treemap Matrix**: Hierarchical heatmaps showing defect-density across project files.

- **Beginner & Expert Modes**:
  - Instant toggle between simple plain-English grades (Score A to F) and advanced data science metrics ($AUC\text{-}ROC$, Cohen's $\kappa$).
  - 60-Second Quick Tour wizard for first-time visitors.

- **Deployment Safety & Zero-Hang Guarantee**:
  - Built-in React `ErrorBoundary` prevents blank screens.
  - Web Audio API synthesizer resumes on user interaction to comply with browser autoplay policies.
  - All API routes include strict 8-second timeouts and automatic heuristic fallbacks.
