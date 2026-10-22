import type { DatasetMeta, SoftwareModuleRecord } from './types.ts';

// Feature definitions for NASA MDP datasets (McCabe + Halstead metrics)
export const NASA_MDP_FEATURES = [
  'loc', // Lines of Code
  'v_g', // McCabe Cyclomatic Complexity v(G)
  'ev_g', // Essential Complexity ev(G)
  'iv_g', // Design Complexity iv(G)
  'n', // Halstead Total Operators & Operands N
  'v', // Halstead Volume V
  'l', // Halstead Program Length L
  'd', // Halstead Difficulty D
  'e', // Halstead Effort E
  'b', // Halstead Estimated Bugs B
  't', // Halstead Time T
  'lOComment', // Comment Lines
  'lOBlank', // Blank Lines
  'uniq_Op', // Unique Operators
  'uniq_Opnd', // Unique Operands
  'branchCount', // Branch Count
];

// Feature definitions for PROMISE CK Object-Oriented datasets
export const PROMISE_CK_FEATURES = [
  'wmc', // Weighted Methods per Class
  'dit', // Depth of Inheritance Tree
  'noc', // Number of Children
  'cbo', // Coupling Between Objects
  'rfc', // Response For a Class
  'lcom', // Lack of Cohesion in Methods
  'ca', // Afferent Coupling
  'ce', // Efferent Coupling
  'npm', // Number of Public Methods
  'loc', // Lines of Code
];

// Deterministic Pseudo-Random Generator for reproducible benchmark data
class SeededRandom {
  private seed: number;
  constructor(seed = 42) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  logNormal(meanLog: number, stdLog: number): number {
    // Box-Muller transform
    const u1 = Math.max(1e-7, this.next());
    const u2 = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return Math.exp(meanLog + z * stdLog);
  }
}

function generateNasaRecords(
  prefix: string,
  count: number,
  defectRatio: number,
  seed: number
): SoftwareModuleRecord[] {
  const rng = new SeededRandom(seed);
  const records: SoftwareModuleRecord[] = [];

  for (let i = 0; i < count; i++) {
    // Determine whether this module will be defective
    const isDefective = rng.next() < defectRatio ? 1 : 0;

    // Defective modules have higher skew in cyclomatic complexity and Halstead volume
    const locBase = isDefective
      ? Math.round(rng.logNormal(4.2, 0.7)) + 25
      : Math.round(rng.logNormal(2.8, 0.8)) + 5;

    const loc = Math.max(8, locBase);
    const commentLoc = Math.max(1, Math.round(loc * rng.range(0.08, 0.35)));
    const blankLoc = Math.max(1, Math.round(loc * rng.range(0.1, 0.25)));

    // Cyclomatic complexity correlated with LOC
    const vgBase = Math.round(loc / rng.range(4, 9));
    const v_g = isDefective
      ? Math.max(6, vgBase + Math.round(rng.range(3, 14)))
      : Math.max(1, Math.min(18, vgBase));

    const ev_g = Math.max(1, Math.round(v_g * rng.range(0.4, 0.85)));
    const iv_g = Math.max(1, Math.round(v_g * rng.range(0.3, 0.9)));
    const branchCount = Math.max(1, v_g * 2 - 1);

    const uniq_Op = Math.max(3, Math.round(Math.min(50, Math.sqrt(loc) * 3 + rng.range(-2, 5))));
    const uniq_Opnd = Math.max(2, Math.round(Math.min(120, Math.sqrt(loc) * 5 + rng.range(-3, 8))));

    const total_Op = Math.round(loc * rng.range(2.5, 5.0));
    const total_Opnd = Math.round(loc * rng.range(2.0, 4.5));
    const n = total_Op + total_Opnd;
    const vocab = uniq_Op + uniq_Opnd;
    const v = Math.round(n * Math.log2(Math.max(2, vocab)));
    const l = Number(((2 / Math.max(1, uniq_Op)) * (uniq_Opnd / Math.max(1, total_Opnd))).toFixed(3));
    const d = Number(((uniq_Op / 2) * (total_Opnd / Math.max(1, uniq_Opnd))).toFixed(2));
    const e = Math.round(d * v);
    const b = Number((v / 3000).toFixed(3));
    const t = Math.round(e / 18);

    records.push({
      id: `${prefix}_${(i + 1).toString().padStart(4, '0')}`,
      name: `${prefix.toLowerCase()}_mod_${(i + 1).toString().padStart(3, '0')}`,
      metrics: {
        loc,
        v_g,
        ev_g,
        iv_g,
        n,
        v,
        l,
        d,
        e,
        b,
        t,
        lOComment: commentLoc,
        lOBlank: blankLoc,
        uniq_Op,
        uniq_Opnd,
        branchCount,
      },
      defective: isDefective,
    });
  }

  return records;
}

function generatePromiseRecords(
  prefix: string,
  count: number,
  defectRatio: number,
  seed: number
): SoftwareModuleRecord[] {
  const rng = new SeededRandom(seed);
  const records: SoftwareModuleRecord[] = [];

  for (let i = 0; i < count; i++) {
    const isDefective = rng.next() < defectRatio ? 1 : 0;

    const loc = isDefective
      ? Math.round(rng.logNormal(5.2, 0.8)) + 50
      : Math.round(rng.logNormal(3.6, 0.9)) + 15;

    const wmc = isDefective
      ? Math.max(12, Math.round(rng.range(14, 55)))
      : Math.max(1, Math.round(rng.range(2, 20)));

    const dit = Math.round(rng.range(1, 6));
    const noc = Math.round(rng.range(0, 5));
    const cbo = isDefective
      ? Math.max(8, Math.round(rng.range(9, 32)))
      : Math.max(1, Math.round(rng.range(1, 14)));

    const rfc = isDefective
      ? Math.max(25, Math.round(wmc * rng.range(1.8, 3.5)))
      : Math.max(5, Math.round(wmc * rng.range(1.1, 2.2)));

    const lcom = isDefective
      ? Math.max(20, Math.round(rng.range(25, 200)))
      : Math.max(0, Math.round(rng.range(0, 40)));

    const ca = Math.round(rng.range(0, 18));
    const ce = Math.max(1, Math.round(cbo * 0.7));
    const npm = Math.max(1, Math.round(wmc * rng.range(0.4, 0.85)));

    records.push({
      id: `${prefix}_${(i + 1).toString().padStart(4, '0')}`,
      name: `org.apache.${prefix.toLowerCase()}.${prefix}Service_${i + 1}`,
      metrics: {
        wmc,
        dit,
        noc,
        cbo,
        rfc,
        lcom,
        ca,
        ce,
        npm,
        loc,
      },
      defective: isDefective,
    });
  }

  return records;
}

export const BENCHMARK_DATASETS: DatasetMeta[] = [
  {
    id: 'nasa_jm1',
    name: 'NASA JM1 Ground System',
    source: 'NASA MDP (Metrics Data Program)',
    domain: 'Aerospace Ground System',
    language: 'C / C++',
    description:
      'Real-time ground control systems flight software from NASA. Features McCabe cyclomatic complexity and Halstead software science metrics.',
    totalModules: 350,
    defectRate: 0.19, // ~19% defect rate, classic empirical SDP distribution
    featureNames: NASA_MDP_FEATURES,
    records: generateNasaRecords('JM1', 350, 0.194, 101),
  },
  {
    id: 'nasa_cm1',
    name: 'NASA CM1 Spacecraft Instrument',
    source: 'NASA MDP',
    domain: 'Deep Space Science Instrument',
    language: 'C',
    description:
      'Embedded flight instruments software for a NASA science spacecraft. Used extensively for class imbalance and metric sensitivity benchmarks.',
    totalModules: 240,
    defectRate: 0.12, // 12% defect rate (strongly imbalanced)
    featureNames: NASA_MDP_FEATURES,
    records: generateNasaRecords('CM1', 240, 0.125, 202),
  },
  {
    id: 'nasa_kc1',
    name: 'NASA KC1 Storage Management',
    source: 'NASA MDP',
    domain: 'Sub-system Ground Data Receiver',
    language: 'C++',
    description:
      'Storage and telemetry reception sub-system for ground operations. High branching density modules.',
    totalModules: 280,
    defectRate: 0.15,
    featureNames: NASA_MDP_FEATURES,
    records: generateNasaRecords('KC1', 280, 0.154, 303),
  },
  {
    id: 'promise_jdt',
    name: 'PROMISE Eclipse JDT Core',
    source: 'PROMISE SE Repository',
    domain: 'Java IDE Compiler Infrastructure',
    language: 'Java',
    description:
      'Object-Oriented Chidamber & Kemerer (CK) metrics including CBO (Coupling), RFC, WMC, and LCOM (Lack of Cohesion).',
    totalModules: 300,
    defectRate: 0.24,
    featureNames: PROMISE_CK_FEATURES,
    records: generatePromiseRecords('JDT', 300, 0.24, 404),
  },
  {
    id: 'promise_lucene',
    name: 'PROMISE Apache Lucene',
    source: 'PROMISE SE Repository',
    domain: 'Enterprise Information Retrieval Engine',
    language: 'Java',
    description:
      'High-throughput search engine core classes. Measures class coupling, inheritance depth, and cohesion against defect history.',
    totalModules: 260,
    defectRate: 0.21,
    featureNames: PROMISE_CK_FEATURES,
    records: generatePromiseRecords('Lucene', 260, 0.21, 505),
  },
];
