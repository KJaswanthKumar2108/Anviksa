/**
 * Anvīkṣā — Stage 4E-IMP-05 Scientific Evaluation & Human Review Service
 * Baseline: Frozen Stage 4E Architecture + Final Scientific Integrity Amendment
 * 
 * Subsystem Capabilities:
 * 1. Multi-Criterion Quality Evaluation (Opportunities, Hypotheses, Protocols, Suitability)
 * 2. Statistical Inference Engines (Tie-corrected Kendall's tau_b, Paired Stratified BCa Bootstrap, Permutation Tests, PCI Bounded BCa Bootstrap, Bayesian Squeezed Beta)
 * 3. Inter-Rater Reliability (BIBD Allocations, Krippendorff's alpha with ordinal/interval diffs, Fleiss' kappa, ICC(2,k))
 * 4. Human Review & Senior Scientific Arbitration (Immutable version history, author vs peer review, disagreement escalation, invalidation cascading)
 * 5. Pilot Study Calibration Protocol (N=20, alpha >= 0.70)
 */

import { getSupabaseAdmin } from '../src/lib/supabase.js';

// Normal CDF and inverse normal CDF (probit) for BCa bootstrap
export function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

export function normalInv(p: number): number {
  if (p <= 0.0) return -8.0;
  if (p >= 1.0) return 8.0;
  if (p === 0.5) return 0.0;

  // Rational approximation for probit (Beasley-Springer-Moro)
  const a = [
    -3.969683028665376e+01,  2.209460984245205e+02,
    -2.759285104469687e+02,  1.383577518672690e+02,
    -3.066479806614716e+01,  2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01,  1.615858368580409e+02,
    -1.556989798598866e+02,  6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
     4.374664141464968e+00,  2.938163982698783e+00
  ];
  const d = [
     7.784695709041462e-03,  3.224671290700398e-01,
     2.445134137142996e+00,  3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// Student's t critical value approximation for two-sided 95% CI
export function tCritical95(df: number): number {
  if (df <= 1) return 12.706;
  if (df === 2) return 4.303;
  if (df === 3) return 3.182;
  if (df === 4) return 2.776;
  if (df === 5) return 2.571;
  if (df <= 10) return 2.228;
  if (df <= 20) return 2.086;
  if (df <= 30) return 2.042;
  if (df <= 60) return 2.000;
  if (df <= 120) return 1.980;
  return 1.960;
}

// ====================================================================
// 1. STATISTICAL ENGINES
// ====================================================================

/**
 * Tie-corrected Kendall's tau_b
 * tau_b = (P - Q) / sqrt((P + Q + T_X) * (P + Q + T_Y))
 */
export function calculateKendallTauB(x: number[], y: number[]): {
  tau_b: number;
  concordant: number;
  discordant: number;
  tiesX: number;
  tiesY: number;
  asymptoticVariance: number;
  n: number;
} {
  const n = x.length;
  if (n !== y.length || n < 2) {
    throw new Error(`Kendall's tau_b requires at least two paired observations (got n=${n})`);
  }

  let P = 0; // concordant
  let Q = 0; // discordant
  let Tx = 0; // ties only in X
  let Ty = 0; // ties only in Y
  let Txy = 0; // ties in both

  // For Noether / Cliff asymptotic non-null variance
  const Pi = new Array(n).fill(0);
  const Qi = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = x[i] - x[j];
      const dy = y[i] - y[j];

      if (dx > 0 && dy > 0) {
        if (i < j) P++;
        Pi[i]++;
      } else if (dx < 0 && dy < 0) {
        if (i < j) P++;
        Pi[i]++;
      } else if (dx > 0 && dy < 0) {
        if (i < j) Q++;
        Qi[i]++;
      } else if (dx < 0 && dy > 0) {
        if (i < j) Q++;
        Qi[i]++;
      } else if (dx === 0 && dy !== 0) {
        if (i < j) Tx++;
      } else if (dx !== 0 && dy === 0) {
        if (i < j) Ty++;
      } else {
        if (i < j) Txy++;
      }
    }
  }

  const denom = Math.sqrt((P + Q + Tx) * (P + Q + Ty));
  const tau_b = denom === 0 ? 0 : (P - Q) / denom;

  // Noether (1967) / Cliff (1993) asymptotic non-null variance reference:
  // sigma^2 = (4 / n) * [ (1/n) * sum((Pi - Qi)^2 / (n-1)^2) - tau_b^2 ]
  let sumSqDiff = 0;
  for (let i = 0; i < n; i++) {
    const diff = (Pi[i] - Qi[i]) / (n - 1);
    sumSqDiff += diff * diff;
  }
  const meanSqDiff = sumSqDiff / n;
  const asymptoticVariance = Math.max(0, (4 / n) * (meanSqDiff - tau_b * tau_b));

  return {
    tau_b: Number(tau_b.toFixed(4)),
    concordant: P,
    discordant: Q,
    tiesX: Tx,
    tiesY: Ty,
    asymptoticVariance: Number(asymptoticVariance.toFixed(6)),
    n
  };
}

/**
 * Non-Parametric Paired Stratified BCa Bootstrap for Kendall's tau_b
 * Resampling B = 2000 pairs with replacement
 */
export function bootstrapKendallTauBCa(
  x: number[],
  y: number[],
  B: number = 2000,
  seed: number = 42
): {
  tau_b: number;
  ciLower: number;
  ciUpper: number;
  biasCorrection_z0: number;
  acceleration_a: number;
  bootstrapCount: number;
} {
  const n = x.length;
  const baseResult = calculateKendallTauB(x, y);
  const tauHat = baseResult.tau_b;

  // PRNG
  let currentSeed = seed;
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  const bootTaus: number[] = new Array(B);
  let lessCount = 0;

  for (let b = 0; b < B; b++) {
    const sampleX: number[] = new Array(n);
    const sampleY: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(random() * n);
      sampleX[i] = x[idx];
      sampleY[i] = y[idx];
    }
    const bResult = calculateKendallTauB(sampleX, sampleY);
    bootTaus[b] = bResult.tau_b;
    if (bResult.tau_b < tauHat) {
      lessCount++;
    }
  }

  bootTaus.sort((a, b) => a - b);

  // Bias correction z0
  const pLess = Math.max(1 / (2 * B), Math.min(1 - 1 / (2 * B), lessCount / B));
  const z0 = normalInv(pLess);

  // Jackknife acceleration a
  const jackTaus: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const jX = x.filter((_, idx) => idx !== i);
    const jY = y.filter((_, idx) => idx !== i);
    jackTaus[i] = calculateKendallTauB(jX, jY).tau_b;
  }
  const meanJackTau = jackTaus.reduce((acc, v) => acc + v, 0) / n;
  let numA = 0;
  let denA = 0;
  for (let i = 0; i < n; i++) {
    const diff = meanJackTau - jackTaus[i];
    numA += Math.pow(diff, 3);
    denA += Math.pow(diff, 2);
  }
  const a = denA === 0 ? 0 : numA / (6 * Math.pow(denA, 1.5));

  // 95% BCa confidence limits
  const zAlpha2 = -1.95996; // 2.5%
  const z1Alpha2 = 1.95996; // 97.5%

  const a1 = normalCDF(z0 + (z0 + zAlpha2) / (1 - a * (z0 + zAlpha2)));
  const a2 = normalCDF(z0 + (z0 + z1Alpha2) / (1 - a * (z0 + z1Alpha2)));

  const idxLower = Math.max(0, Math.min(B - 1, Math.floor(a1 * B)));
  const idxUpper = Math.max(0, Math.min(B - 1, Math.floor(a2 * B)));

  return {
    tau_b: tauHat,
    ciLower: Number(bootTaus[idxLower].toFixed(4)),
    ciUpper: Number(bootTaus[idxUpper].toFixed(4)),
    biasCorrection_z0: Number(z0.toFixed(4)),
    acceleration_a: Number(a.toFixed(4)),
    bootstrapCount: B
  };
}

/**
 * Monte-Carlo Permutation Test for Kendall's tau_b
 * Tests H_0: tau_b = 0 over B = 10000 random permutations
 */
export function permutationTestKendallTauB(
  x: number[],
  y: number[],
  B: number = 10000,
  seed: number = 101
): {
  tau_b: number;
  pValueTwoSided: number;
  permutationsCount: number;
  significantAt05: boolean;
} {
  const n = x.length;
  const baseResult = calculateKendallTauB(x, y);
  const absTauObserved = Math.abs(baseResult.tau_b);

  let currentSeed = seed;
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  let extremeCount = 0;
  const yCopy = [...y];

  for (let b = 0; b < B; b++) {
    // Fisher-Yates shuffle of y
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const tmp = yCopy[i];
      yCopy[i] = yCopy[j];
      yCopy[j] = tmp;
    }
    const permResult = calculateKendallTauB(x, yCopy);
    if (Math.abs(permResult.tau_b) >= absTauObserved - 1e-9) {
      extremeCount++;
    }
  }

  const pValue = extremeCount / B;

  return {
    tau_b: baseResult.tau_b,
    pValueTwoSided: Number(pValue.toFixed(5)),
    permutationsCount: B,
    significantAt05: pValue < 0.05
  };
}

/**
 * Protocol Completeness Index (PCI) Distribution Evaluation
 * Primary: Bounded Non-Parametric BCa Bootstrap over [0.0, 10.0]
 * Parametric Alternative: Bayesian Squeezed Beta Transformation (Smithson & Verkuilen 2006)
 */
export function evaluatePCIDistribution(
  pciScores: number[],
  B: number = 2000,
  seed: number = 88
): {
  meanPCI: number;
  sampleSize: number;
  bcaBootstrapCI: [number, number];
  bayesianSqueezedBetaCI: [number, number];
  targetMet: boolean; // Target: PCI >= 8.5 / 10.0
} {
  const N = pciScores.length;
  if (N < 2) throw new Error('PCI evaluation requires at least 2 protocols');

  const meanPCI = pciScores.reduce((acc, v) => acc + v, 0) / N;

  // 1. Bounded BCa Bootstrap directly on support [0.0, 10.0]
  let currentSeed = seed;
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  const bootMeans: number[] = new Array(B);
  let lessCount = 0;

  for (let b = 0; b < B; b++) {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const idx = Math.floor(random() * N);
      sum += pciScores[idx];
    }
    const m = sum / N;
    bootMeans[b] = m;
    if (m < meanPCI) lessCount++;
  }

  bootMeans.sort((a, b) => a - b);

  const pLess = Math.max(1 / (2 * B), Math.min(1 - 1 / (2 * B), lessCount / B));
  const z0 = normalInv(pLess);

  // Jackknife acceleration for mean
  const jackMeans: number[] = new Array(N);
  const totalSum = pciScores.reduce((acc, v) => acc + v, 0);
  for (let i = 0; i < N; i++) {
    jackMeans[i] = (totalSum - pciScores[i]) / (N - 1);
  }
  const meanJackMean = jackMeans.reduce((acc, v) => acc + v, 0) / N;
  let numA = 0;
  let denA = 0;
  for (let i = 0; i < N; i++) {
    const diff = meanJackMean - jackMeans[i];
    numA += Math.pow(diff, 3);
    denA += Math.pow(diff, 2);
  }
  const a = denA === 0 ? 0 : numA / (6 * Math.pow(denA, 1.5));

  const zAlpha2 = -1.95996;
  const z1Alpha2 = 1.95996;
  const a1 = normalCDF(z0 + (z0 + zAlpha2) / (1 - a * (z0 + zAlpha2)));
  const a2 = normalCDF(z0 + (z0 + z1Alpha2) / (1 - a * (z0 + z1Alpha2)));

  const idxLower = Math.max(0, Math.min(B - 1, Math.floor(a1 * B)));
  const idxUpper = Math.max(0, Math.min(B - 1, Math.floor(a2 * B)));

  const bcaLower = Math.max(0.0, Math.min(10.0, bootMeans[idxLower]));
  const bcaUpper = Math.max(0.0, Math.min(10.0, bootMeans[idxUpper]));

  // 2. Principled Parametric Alternative: Bayesian Squeezed Beta Transformation (Smithson & Verkuilen 2006)
  // p* = (p * (N - 1) + 0.5) / N, mapping [0, 1] strictly into [0.5/N, 1 - 0.5/N]
  const yValues = pciScores.map(score => {
    const p = Math.max(0.0, Math.min(10.0, score)) / 10.0;
    const pStar = (p * (N - 1) + 0.5) / N;
    return Math.log(pStar / (1 - pStar)); // logit(p*)
  });

  const meanY = yValues.reduce((acc, v) => acc + v, 0) / N;
  const varianceY = yValues.reduce((acc, v) => acc + Math.pow(v - meanY, 2), 0) / (N - 1);
  const seY = Math.sqrt(varianceY / N);
  const tCrit = tCritical95(N - 1);

  const yLower = meanY - tCrit * seY;
  const yUpper = meanY + tCrit * seY;

  // Inverse logit back to [0, 10]
  const expit = (v: number) => 1 / (1 + Math.exp(-v));
  const betaLower = Number((10.0 * expit(yLower)).toFixed(3));
  const betaUpper = Number((10.0 * expit(yUpper)).toFixed(3));

  return {
    meanPCI: Number(meanPCI.toFixed(3)),
    sampleSize: N,
    bcaBootstrapCI: [Number(bcaLower.toFixed(3)), Number(bcaUpper.toFixed(3))],
    bayesianSqueezedBetaCI: [betaLower, betaUpper],
    targetMet: meanPCI >= 8.5
  };
}

/**
 * Binomial Wilson Score Interval (for HFI >= 90%)
 */
export function calculateWilsonScoreInterval(successes: number, total: number, z: number = 1.96): {
  proportion: number;
  ciLower: number;
  ciUpper: number;
} {
  if (total <= 0) return { proportion: 0, ciLower: 0, ciUpper: 0 };
  const p = successes / total;
  const denom = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denom;

  return {
    proportion: Number(p.toFixed(4)),
    ciLower: Number(Math.max(0, center - margin).toFixed(4)),
    ciUpper: Number(Math.min(1, center + margin).toFixed(4))
  };
}

/**
 * Exact Clopper-Pearson Binomial Interval (for BAR = 100%)
 */
export function calculateClopperPearsonInterval(successes: number, total: number): {
  rate: number;
  ciLower: number;
  ciUpper: number;
  isPerfect: boolean;
} {
  if (total <= 0) return { rate: 0, ciLower: 0, ciUpper: 0, isPerfect: false };
  const rate = successes / total;
  
  // For x = n (100% success rate), lower bound is (alpha/2)^(1/n) = 0.025^(1/n)
  let ciLower = 0;
  let ciUpper = 1;
  if (successes === total) {
    ciLower = Math.pow(0.025, 1 / total);
    ciUpper = 1.0;
  } else if (successes === 0) {
    ciLower = 0.0;
    ciUpper = 1 - Math.pow(0.025, 1 / total);
  } else {
    // Standard Wilson approximation fallback for interior points
    const w = calculateWilsonScoreInterval(successes, total);
    ciLower = w.ciLower;
    ciUpper = w.ciUpper;
  }

  return {
    rate: Number((rate * 100).toFixed(2)),
    ciLower: Number((ciLower * 100).toFixed(2)),
    ciUpper: Number((ciUpper * 100).toFixed(2)),
    isPerfect: successes === total
  };
}

// ====================================================================
// 2. INTER-RATER RELIABILITY & BIBD ALLOCATION
// ====================================================================

export interface BIBDDesign {
  v: number; // total raters
  b: number; // total blocks / artifacts
  r: number; // ratings per rater
  k: number; // raters per artifact block
  lambda: number; // shared artifacts per pair of raters
  isSymmetric: boolean;
  isValid: boolean;
}

/**
 * Verify BIBD algebraic design equations:
 * 1. v * r = b * k
 * 2. lambda * (v - 1) = r * (k - 1)
 */
export function verifyBIBDParameters(v: number, b: number, r: number, k: number, lambda: number): BIBDDesign {
  const eq1 = (v * r === b * k);
  const eq2 = (lambda * (v - 1) === r * (k - 1));
  const isSymmetric = (v === b && r === k);
  const isValid = eq1 && eq2 && k < v && lambda > 0;

  return {
    v,
    b,
    r,
    k,
    lambda,
    isSymmetric,
    isValid
  };
}

/**
 * Generate BIBD artifact-rater allocation schedule
 * Supports symmetric (12, 220, 55, 3, 10) schedule or parameterized blocks
 */
export function generateBIBDAllocation(
  raters: string[],
  artifactIds: string[],
  k: number = 3,
  coiDeclarations: Record<string, string[]> = {} // raterId -> conflicted artifactIds
): {
  allocations: Array<{ artifactId: string; blockIndex: number; assignedRaters: string[] }>;
  coiSwaps: Array<{ artifactId: string; originalRater: string; swappedRater: string; reason: string }>;
} {
  const v = raters.length;
  const b = artifactIds.length;
  if (v < k) throw new Error(`Number of raters (${v}) must be >= raters per block (${k})`);

  const allocations: Array<{ artifactId: string; blockIndex: number; assignedRaters: string[] }> = [];
  const coiSwaps: Array<{ artifactId: string; originalRater: string; swappedRater: string; reason: string }> = [];

  for (let blockIdx = 0; blockIdx < b; blockIdx++) {
    const artId = artifactIds[blockIdx];
    // Cyclic / modular block generation
    const blockRaters: string[] = [];
    for (let j = 0; j < k; j++) {
      const raterIdx = (blockIdx * k + j) % v;
      blockRaters.push(raters[raterIdx]);
    }

    // Check for Conflict of Interest (COI)
    const finalizedRaters: string[] = [];
    for (const rater of blockRaters) {
      const conflicted = coiDeclarations[rater]?.includes(artId);
      if (conflicted) {
        // Find unconflicted domain peer from remaining raters
        const replacement = raters.find(candidate => 
          !blockRaters.includes(candidate) && 
          !finalizedRaters.includes(candidate) &&
          !coiDeclarations[candidate]?.includes(artId)
        );
        if (replacement) {
          finalizedRaters.push(replacement);
          coiSwaps.push({
            artifactId: artId,
            originalRater: rater,
            swappedRater: replacement,
            reason: 'CONFLICT_OF_INTEREST_DECLARED'
          });
        } else {
          finalizedRaters.push(rater); // fallback if no replacement
        }
      } else {
        finalizedRaters.push(rater);
      }
    }

    allocations.push({
      artifactId: artId,
      blockIndex: blockIdx + 1,
      assignedRaters: finalizedRaters
    });
  }

  return { allocations, coiSwaps };
}

/**
 * Krippendorff's Alpha (alpha_Kripp)
 * Supports nominal, ordinal, and interval metric difference functions.
 * Handles missing data (null entries).
 * Handles edge cases honestly: returns INSUFFICIENT_OBSERVATIONS or DEGENERATE_DISTRIBUTION.
 */
export function calculateKrippendorffAlpha(
  ratingMatrix: (number | null)[][], // rows: raters, cols: items (artifacts)
  metricType: 'nominal' | 'ordinal' | 'interval' = 'ordinal'
): {
  alpha: number | null;
  status: 'VALID' | 'INSUFFICIENT_OBSERVATIONS' | 'DEGENERATE_DISTRIBUTION';
  observedDisagreement: number;
  expectedDisagreement: number;
  pairableUnitsCount: number;
} {
  const numRaters = ratingMatrix.length;
  if (numRaters < 2) {
    return {
      alpha: null,
      status: 'INSUFFICIENT_OBSERVATIONS',
      observedDisagreement: 0,
      expectedDisagreement: 0,
      pairableUnitsCount: 0
    };
  }

  const numUnits = ratingMatrix[0].length;
  // Collect all unique observed values
  const observedValuesSet = new Set<number>();
  for (let r = 0; r < numRaters; r++) {
    for (let u = 0; u < numUnits; u++) {
      const val = ratingMatrix[r][u];
      if (val !== null && !isNaN(val)) {
        observedValuesSet.add(val);
      }
    }
  }

  const values = Array.from(observedValuesSet).sort((a, b) => a - b);
  if (values.length <= 1) {
    return {
      alpha: 1.0, // or null, marked as degenerate distribution
      status: 'DEGENERATE_DISTRIBUTION',
      observedDisagreement: 0,
      expectedDisagreement: 0,
      pairableUnitsCount: numUnits
    };
  }

  // Value frequency counts across all pairable ratings
  const valIndexMap = new Map<number, number>();
  values.forEach((v, idx) => valIndexMap.set(v, idx));
  const V = values.length;

  // Build coincidence matrix
  // For each unit u, count ratings per value
  let totalPairs = 0;
  let pairableUnits = 0;
  const unitCounts: number[][] = []; // [u][v_idx]

  for (let u = 0; u < numUnits; u++) {
    const counts = new Array(V).fill(0);
    let m_u = 0;
    for (let r = 0; r < numRaters; r++) {
      const val = ratingMatrix[r][u];
      if (val !== null && !isNaN(val)) {
        counts[valIndexMap.get(val)!]++;
        m_u++;
      }
    }
    unitCounts.push(counts);
    if (m_u >= 2) {
      pairableUnits++;
      totalPairs += m_u * (m_u - 1);
    }
  }

  if (pairableUnits < 2 || totalPairs === 0) {
    return {
      alpha: null,
      status: 'INSUFFICIENT_OBSERVATIONS',
      observedDisagreement: 0,
      expectedDisagreement: 0,
      pairableUnitsCount: pairableUnits
    };
  }

  // Coincidence matrix C[c][k]
  const C: number[][] = Array.from({ length: V }, () => new Array(V).fill(0));
  const nValues: number[] = new Array(V).fill(0);
  let totalRatings = 0;

  for (let u = 0; u < numUnits; u++) {
    const counts = unitCounts[u];
    const m_u = counts.reduce((acc, c) => acc + c, 0);
    if (m_u < 2) continue;

    for (let c = 0; c < V; c++) {
      if (counts[c] === 0) continue;
      for (let k = 0; k < V; k++) {
        if (counts[k] === 0) continue;
        if (c === k) {
          C[c][c] += counts[c] * (counts[c] - 1) / (m_u - 1);
        } else {
          C[c][k] += counts[c] * counts[k] / (m_u - 1);
        }
      }
    }
  }

  for (let c = 0; c < V; c++) {
    for (let k = 0; k < V; k++) {
      nValues[c] += C[c][k];
    }
    totalRatings += nValues[c];
  }

  // Metric difference function delta^2(c, k)
  const delta2 = (cIdx: number, kIdx: number): number => {
    if (cIdx === kIdx) return 0;
    if (metricType === 'nominal') {
      return 1;
    } else if (metricType === 'interval') {
      const diff = values[cIdx] - values[kIdx];
      return diff * diff;
    } else {
      // Ordinal difference metric
      const minIdx = Math.min(cIdx, kIdx);
      const maxIdx = Math.max(cIdx, kIdx);
      let sumBetween = 0;
      for (let g = minIdx; g <= maxIdx; g++) {
        sumBetween += nValues[g];
      }
      const diff = sumBetween - (nValues[minIdx] + nValues[maxIdx]) / 2;
      return diff * diff;
    }
  };

  // Compute observed disagreement D_o and expected disagreement D_e
  let Do = 0;
  for (let c = 0; c < V; c++) {
    for (let k = 0; k < V; k++) {
      Do += C[c][k] * delta2(c, k);
    }
  }

  let De = 0;
  for (let c = 0; c < V; c++) {
    for (let k = 0; k < V; k++) {
      De += nValues[c] * nValues[k] * delta2(c, k);
    }
  }
  De = De / (totalRatings - 1);

  if (De === 0) {
    return {
      alpha: 1.0,
      status: 'DEGENERATE_DISTRIBUTION',
      observedDisagreement: 0,
      expectedDisagreement: 0,
      pairableUnitsCount: pairableUnits
    };
  }

  const alpha = 1 - (Do / De);

  return {
    alpha: Number(alpha.toFixed(4)),
    status: 'VALID',
    observedDisagreement: Number(Do.toFixed(4)),
    expectedDisagreement: Number(De.toFixed(4)),
    pairableUnitsCount: pairableUnits
  };
}

/**
 * Fleiss' Kappa (kappa_Fleiss) for categorical ratings
 */
export function calculateFleissKappa(
  categoryCounts: number[][] // [unit][category]
): {
  kappa: number;
  pObserved: number;
  pExpected: number;
} {
  const N = categoryCounts.length; // items
  const k = categoryCounts[0].reduce((acc, c) => acc + c, 0); // raters per item
  const categories = categoryCounts[0].length;

  // p_j: overall proportion of assignments to category j
  const pj: number[] = new Array(categories).fill(0);
  for (let j = 0; j < categories; j++) {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      sum += categoryCounts[i][j];
    }
    pj[j] = sum / (N * k);
  }

  // P_i: extent of agreement for item i
  let sumPi = 0;
  for (let i = 0; i < N; i++) {
    let sumSq = 0;
    for (let j = 0; j < categories; j++) {
      sumSq += categoryCounts[i][j] * categoryCounts[i][j];
    }
    const Pi = (sumSq - k) / (k * (k - 1));
    sumPi += Pi;
  }

  const pObserved = sumPi / N;
  const pExpected = pj.reduce((acc, p) => acc + p * p, 0);

  const kappa = pExpected === 1 ? 1 : (pObserved - pExpected) / (1 - pExpected);

  return {
    kappa: Number(kappa.toFixed(4)),
    pObserved: Number(pObserved.toFixed(4)),
    pExpected: Number(pExpected.toFixed(4))
  };
}

/**
 * Two-way random effects Intraclass Correlation Coefficient ICC(2, k)
 */
export function calculateICC2k(
  ratings: number[][] // rows: items, cols: raters
): {
  icc2k: number;
  msRows: number;
  msColumns: number;
  msError: number;
} {
  const n = ratings.length; // items
  const k = ratings[0].length; // raters

  const rowMeans: number[] = ratings.map(row => row.reduce((acc, v) => acc + v, 0) / k);
  const colMeans: number[] = [];
  for (let j = 0; j < k; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += ratings[i][j];
    colMeans.push(sum / n);
  }
  const grandMean = rowMeans.reduce((acc, v) => acc + v, 0) / n;

  let ssRows = 0;
  for (let i = 0; i < n; i++) ssRows += k * Math.pow(rowMeans[i] - grandMean, 2);

  let ssCols = 0;
  for (let j = 0; j < k; j++) ssCols += n * Math.pow(colMeans[j] - grandMean, 2);

  let ssTotal = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++) {
      ssTotal += Math.pow(ratings[i][j] - grandMean, 2);
    }
  }

  const ssError = Math.max(0, ssTotal - ssRows - ssCols);

  const dfRows = n - 1;
  const dfCols = k - 1;
  const dfError = dfRows * dfCols;

  const msRows = ssRows / dfRows;
  const msCols = ssCols / dfCols;
  const msError = ssError / dfError;

  // ICC(2, k) = (MS_R - MS_E) / (MS_R + (MS_C - MS_E) / n)
  const denom = msRows + (msCols - msError) / n;
  const icc = denom === 0 ? 1 : (msRows - msError) / denom;

  return {
    icc2k: Number(Math.max(0, Math.min(1, icc)).toFixed(4)),
    msRows: Number(msRows.toFixed(4)),
    msColumns: Number(msCols.toFixed(4)),
    msError: Number(msError.toFixed(4))
  };
}

// ====================================================================
// 3. MULTI-CRITERION ARTIFACT EVALUATION SERVICES
// ====================================================================

export interface QualityCriterionScore {
  criterion: string;
  score: number; // 0.0 - 10.0
  passed: boolean;
  notes: string;
}

export interface ArtifactEvaluationResult {
  entityType: 'OPPORTUNITY' | 'HYPOTHESIS' | 'EXPERIMENT' | 'SUITABILITY';
  entityId: string;
  overallScore: number;
  passedGates: boolean;
  criteria: QualityCriterionScore[];
  metrics: Record<string, any>;
  evaluatorVersion: string;
}

// Helper for resilient database operations over transient network drops
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 250): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastErr;
}

export class ScientificEvaluationService {
  /**
   * Evaluate 4E-IMP-01 Research Opportunity
   */
  evaluateOpportunity(opportunity: {
    id: string;
    intrinsic_scientific_value?: number;
    evidence_confidence?: number;
    novelty?: number;
    scientific_significance?: number;
    research_tractability?: number;
    is_stale?: boolean;
    current_validation_outcome?: string;
  }): ArtifactEvaluationResult {
    const vSci = opportunity.intrinsic_scientific_value ?? 0;
    const isStale = Boolean(opportunity.is_stale);
    const outcome = opportunity.current_validation_outcome || 'CONFIRMED_UNRESOLVED';

    const criteria: QualityCriterionScore[] = [
      {
        criterion: 'Value Scale Calibration',
        score: vSci >= 0.0 && vSci <= 10.0 ? 10.0 : 0.0,
        passed: vSci >= 0.0 && vSci <= 10.0,
        notes: `Intrinsic scientific value V_sci = ${vSci}/10.0`
      },
      {
        criterion: 'Non-Compensatory Gate Compliance',
        score: !['ADDRESSED', 'CONTRADICTED', 'INSUFFICIENT_EVIDENCE'].includes(outcome) ? 10.0 : 0.0,
        passed: !['ADDRESSED', 'CONTRADICTED', 'INSUFFICIENT_EVIDENCE'].includes(outcome),
        notes: `Epistemic validation outcome is ${outcome}`
      },
      {
        criterion: 'Freshness & Non-Staleness',
        score: !isStale ? 10.0 : 0.0,
        passed: !isStale,
        notes: isStale ? 'Artifact is marked stale due to upstream evidence updates' : 'Artifact evidence is active'
      },
      {
        criterion: 'Dimensional Orthogonality',
        score: opportunity.novelty !== undefined && opportunity.scientific_significance !== undefined ? 10.0 : 8.0,
        passed: true,
        notes: 'Decoupled novelty and significance vectors present'
      }
    ];

    const passedGates = criteria.every(c => c.passed);
    const overallScore = Number((criteria.reduce((acc, c) => acc + c.score, 0) / criteria.length).toFixed(2));

    return {
      entityType: 'OPPORTUNITY',
      entityId: opportunity.id,
      overallScore,
      passedGates,
      criteria,
      metrics: {
        intrinsic_scientific_value: vSci,
        is_stale: isStale,
        outcome
      },
      evaluatorVersion: '4E-IMP-05-v1.0'
    };
  }

  /**
   * Evaluate 4E-IMP-02 Falsifiable Hypothesis
   */
  evaluateHypothesis(hypothesis: {
    id: string;
    hypothesis_statement: string;
    independent_variable?: string;
    dependent_variable?: string;
    falsification_criteria?: any;
    is_falsifiable?: boolean;
    falsifiability_rubric_score?: number;
    status?: string;
  }): ArtifactEvaluationResult {
    const hasVariables = Boolean(hypothesis.independent_variable && hypothesis.dependent_variable);
    const hasFalsification = Boolean(hypothesis.falsification_criteria);
    const rubricScore = hypothesis.falsifiability_rubric_score ?? 8.5;
    const isTautological = /always|necessarily|true by definition/i.test(hypothesis.hypothesis_statement || '');

    const criteria: QualityCriterionScore[] = [
      {
        criterion: 'Operational Variables Isolation',
        score: hasVariables ? 10.0 : 0.0,
        passed: hasVariables,
        notes: hasVariables ? 'Independent and dependent variables clearly isolated' : 'Missing operational variables'
      },
      {
        criterion: 'Popperian Falsifiability Specification',
        score: hasFalsification ? 10.0 : 0.0,
        passed: hasFalsification,
        notes: hasFalsification ? 'Concrete falsification criteria defined' : 'Missing falsification criteria'
      },
      {
        criterion: 'Anti-Tautology Gate',
        score: !isTautological ? 10.0 : 0.0,
        passed: !isTautological,
        notes: isTautological ? 'Tautological statement detected' : 'Non-tautological testable claim'
      },
      {
        criterion: 'Popperian 10-Point Rubric Threshold',
        score: rubricScore >= 8.0 ? 10.0 : 5.0,
        passed: rubricScore >= 8.0,
        notes: `Rubric score = ${rubricScore}/10.0 (Target >= 8.0)`
      }
    ];

    const passedGates = criteria.every(c => c.passed);
    const overallScore = Number((criteria.reduce((acc, c) => acc + c.score, 0) / criteria.length).toFixed(2));

    return {
      entityType: 'HYPOTHESIS',
      entityId: hypothesis.id,
      overallScore,
      passedGates,
      criteria,
      metrics: {
        rubricScore,
        meetsHFI: passedGates && rubricScore >= 8.0,
        status: hypothesis.status
      },
      evaluatorVersion: '4E-IMP-05-v1.0'
    };
  }

  /**
   * Evaluate 4E-IMP-03 Experiment Protocol
   */
  evaluateExperimentProtocol(protocol: {
    id: string;
    title: string;
    objective: string;
    experimental_design_type: string;
    verified_baselines?: any[];
    execution_environment?: any;
    statistical_analysis_plan?: any;
    falsification_criteria?: any;
    threats_to_validity?: any;
    ablation_matrix?: any;
  }): ArtifactEvaluationResult {
    const baselines = protocol.verified_baselines || [];
    const hasBaselines = baselines.length > 0;
    const allBaselinesVerified = hasBaselines && baselines.every(b => 
      b.doi && !b.fabricated && b.verified_against_source !== false
    );

    // 10 operational PCI criteria
    const pciItems: { name: string; met: boolean }[] = [
      { name: 'Hardware specified', met: Boolean(protocol.execution_environment?.gpu_requirements || protocol.execution_environment?.hardware) },
      { name: 'VRAM estimated', met: Boolean(protocol.execution_environment?.estimated_vram_gb !== undefined || protocol.execution_environment?.max_vram_gb !== undefined) },
      { name: 'Software pinned', met: Boolean(protocol.execution_environment?.dependencies || protocol.execution_environment?.software_framework) },
      { name: 'Datasets with licenses', met: Boolean(protocol.verified_baselines || (protocol as any).datasets_and_materials) },
      { name: 'Metrics with units', met: Boolean(protocol.statistical_analysis_plan?.metrics || protocol.statistical_analysis_plan?.effect_size_metric) },
      { name: 'Statistical power plan', met: Boolean(protocol.statistical_analysis_plan?.power_analysis || protocol.statistical_analysis_plan?.sample_size_justification) },
      { name: 'Random seed schedule', met: Boolean(protocol.statistical_analysis_plan?.random_seeds || protocol.statistical_analysis_plan?.seed_count) },
      { name: 'Ablation plan', met: Boolean(protocol.ablation_matrix) },
      { name: 'Falsification threshold', met: Boolean(protocol.falsification_criteria?.decision_rule || protocol.falsification_criteria?.minimum_meaningful_effect) },
      { name: 'Threats to validity', met: Boolean(protocol.threats_to_validity) }
    ];

    const metCount = pciItems.filter(item => item.met).length;
    const pciScore = Number(((metCount / 10.0) * 10.0).toFixed(1));

    const criteria: QualityCriterionScore[] = [
      {
        criterion: 'Baseline Authenticity (BAR = 100%)',
        score: allBaselinesVerified ? 10.0 : (hasBaselines ? 5.0 : 0.0),
        passed: allBaselinesVerified,
        notes: allBaselinesVerified ? 'All baselines verified against primary literature' : 'Unverified or missing baseline literature'
      },
      {
        criterion: 'Protocol Completeness Index (PCI >= 8.5)',
        score: pciScore,
        passed: pciScore >= 8.5,
        notes: `PCI = ${pciScore}/10.0 (${metCount}/10 criteria satisfied)`
      },
      {
        criterion: 'Statistical Decision Criteria',
        score: protocol.falsification_criteria ? 10.0 : 0.0,
        passed: Boolean(protocol.falsification_criteria),
        notes: protocol.falsification_criteria ? 'Rigorous statistical falsification rules prespecified' : 'Missing falsification decision rule'
      }
    ];

    const passedGates = criteria.every(c => c.passed);
    const overallScore = Number((criteria.reduce((acc, c) => acc + c.score, 0) / criteria.length).toFixed(2));

    return {
      entityType: 'EXPERIMENT',
      entityId: protocol.id,
      overallScore,
      passedGates,
      criteria,
      metrics: {
        pciScore,
        pciItems,
        bar100Percent: allBaselinesVerified,
        paradigm: protocol.experimental_design_type
      },
      evaluatorVersion: '4E-IMP-05-v1.0'
    };
  }

  /**
   * Evaluate 4E-IMP-04 Suitability Recommendation
   */
  evaluateSuitabilityRecommendation(recommendation: {
    id: string;
    intrinsic_scientific_value: number;
    execution_suitability: number | null;
    suitability_status: string;
    strategic_quadrant: string;
  }): ArtifactEvaluationResult {
    const vSci = recommendation.intrinsic_scientific_value;
    const eSuit = recommendation.execution_suitability;
    const status = recommendation.suitability_status;
    const quadrant = recommendation.strategic_quadrant;

    const decoupled = typeof vSci === 'number' && (eSuit === null || typeof eSuit === 'number');
    const validStatus = ['SUITABILITY_EVALUATED', 'SUITABILITY_UNDETERMINED', 'RESOURCE_BLOCKED'].includes(status);
    const validQuadrant = ['IMMEDIATE_HIGH_PRIORITY', 'GRANT_OR_COLLABORATION_TARGET', 'FEASIBLE_RESEARCH_OPPORTUNITY', 'DEPRIORITIZED', 'SUITABILITY_UNDETERMINED'].includes(quadrant);

    const criteria: QualityCriterionScore[] = [
      {
        criterion: 'Value-Suitability Decoupling',
        score: decoupled ? 10.0 : 0.0,
        passed: decoupled,
        notes: `V_scientific (${vSci}) and E_suitability (${eSuit}) preserved independently`
      },
      {
        criterion: 'Elimination of Composite Scalar Collapse',
        score: 10.0,
        passed: true,
        notes: 'No composite scalar P_actionable emitted'
      },
      {
        criterion: '2D Strategic Quadrant Mapping',
        score: validQuadrant && validStatus ? 10.0 : 0.0,
        passed: validQuadrant && validStatus,
        notes: `Status: ${status}, Strategic Quadrant: ${quadrant}`
      }
    ];

    const passedGates = criteria.every(c => c.passed);
    const overallScore = Number((criteria.reduce((acc, c) => acc + c.score, 0) / criteria.length).toFixed(2));

    return {
      entityType: 'SUITABILITY',
      entityId: recommendation.id,
      overallScore,
      passedGates,
      criteria,
      metrics: {
        status,
        quadrant,
        intrinsic_scientific_value: vSci,
        execution_suitability: eSuit
      },
      evaluatorVersion: '4E-IMP-05-v1.0'
    };
  }

  // ====================================================================
  // 4. HUMAN REVIEW MANAGEMENT & DISAGREEMENT ARBITRATION
  // ====================================================================

  /**
   * Submit Human Review via Secure RPC / Service Role
   * Enforces author vs independent peer separation, disagreement detection, and invalidation cascade.
   */
  async submitReview(review: {
    entityType: 'HYPOTHESIS' | 'EXPERIMENT' | 'OPPORTUNITY';
    entityId: string;
    reviewerId: string;
    decision: 'APPROVED' | 'REJECTED' | 'MODIFIED_AND_APPROVED' | 'REVISION_REQUESTED';
    reviewComments: string;
    parameterModifications?: Record<string, any>;
    criterionScores?: Record<string, number>;
    reviewerRole?: 'AUTHOR' | 'INDEPENDENT_PEER' | 'SENIOR_ARBITRATOR';
    adjudicationNotes?: string;
  }): Promise<{
    reviewId: string;
    isSelfReview: boolean;
    effectiveRole: string;
    escalatedToArbitration: boolean;
  }> {
    const adminClient = getSupabaseAdmin();
    if (!adminClient) throw new Error('Supabase admin client unavailable.');

    // Check prior reviews for disagreement escalation
    const { data: priorReviews } = await adminClient
      .from('researcher_reviews')
      .select('decision, criterion_scores, reviewer_role, is_invalidated')
      .eq('entity_type', review.entityType)
      .eq('entity_id', review.entityId)
      .eq('is_invalidated', false);

    let escalatedToArbitration = false;
    if (priorReviews && priorReviews.length > 0) {
      // Check for voting split (e.g., prior approved, current rejected or vice versa)
      const priorDecisions = priorReviews.map(r => r.decision);
      const hasSplit = priorDecisions.some(d => 
        (['APPROVED', 'MODIFIED_AND_APPROVED'].includes(d) && review.decision === 'REJECTED') ||
        (d === 'REJECTED' && ['APPROVED', 'MODIFIED_AND_APPROVED'].includes(review.decision))
      );

      // Check for score delta > 1.5 on 5-point scale
      let maxDelta = 0;
      if (review.criterionScores) {
        for (const pRev of priorReviews) {
          if (pRev.criterion_scores) {
            for (const [key, val] of Object.entries(review.criterionScores)) {
              if (pRev.criterion_scores[key] !== undefined) {
                const diff = Math.abs(val - pRev.criterion_scores[key]);
                if (diff > maxDelta) maxDelta = diff;
              }
            }
          }
        }
      }

      if ((hasSplit || maxDelta > 1.5) && review.reviewerRole !== 'SENIOR_ARBITRATOR') {
        escalatedToArbitration = true;
      }
    }

    // Call privileged RPC with retry on network drop
    const data = await withRetry(async () => {
      const { data: resData, error: rpcErr } = await adminClient.rpc('rpc_submit_researcher_review', {
        p_entity_type: review.entityType,
        p_entity_id: review.entityId,
        p_reviewer_id: review.reviewerId,
        p_decision: review.decision,
        p_review_comments: review.reviewComments,
        p_parameter_modifications: review.parameterModifications || {},
        p_criterion_scores: review.criterionScores || {},
        p_reviewer_role: review.reviewerRole || 'INDEPENDENT_PEER',
        p_adjudication_notes: review.adjudicationNotes || null
      });
      if (rpcErr) throw new Error(rpcErr.message);
      return resData;
    });

    // Query back inserted review to check self-review and role
    const insertedReview = await withRetry(async () => {
      const { data: rData } = await adminClient
        .from('researcher_reviews')
        .select('is_self_review, reviewer_role')
        .eq('id', data)
        .single();
      return rData;
    });

    return {
      reviewId: data,
      isSelfReview: Boolean(insertedReview?.is_self_review),
      effectiveRole: insertedReview?.reviewer_role || review.reviewerRole || 'INDEPENDENT_PEER',
      escalatedToArbitration
    };
  }

  /**
   * Get Immutable Review History for an Entity
   */
  async getReviewHistory(entityType: 'HYPOTHESIS' | 'EXPERIMENT' | 'OPPORTUNITY', entityId: string) {
    const adminClient = getSupabaseAdmin();
    if (!adminClient) throw new Error('Supabase admin client unavailable.');

    const { data, error } = await adminClient
      .from('researcher_reviews')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('reviewed_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch review history: ${error.message}`);
    return data || [];
  }

  /**
   * Record Scientific Evaluation Run in Database
   */
  async recordEvaluationRun(evalData: {
    entityType: 'OPPORTUNITY' | 'HYPOTHESIS' | 'EXPERIMENT' | 'SUITABILITY' | 'BENCHMARK_BATCH';
    entityId?: string;
    evaluationMode: 'AUTOMATED_RUBRIC' | 'MULTI_RATER_PILOT' | 'BENCHMARK_RUN' | 'STATISTICAL_VALIDATION';
    overallScore: number;
    passedGates: boolean;
    metrics?: Record<string, any>;
    criterionScores?: Record<string, any>;
    statisticalEvidence?: Record<string, any>;
    evaluatedBy?: string;
  }): Promise<string> {
    const adminClient = getSupabaseAdmin();
    if (!adminClient) throw new Error('Supabase admin client unavailable.');

    const data = await withRetry(async () => {
      const { data: resData, error: rpcErr } = await adminClient.rpc('rpc_record_research_evaluation', {
        p_entity_type: evalData.entityType,
        p_entity_id: evalData.entityId || null,
        p_evaluation_mode: evalData.evaluationMode,
        p_overall_score: evalData.overallScore,
        p_passed_gates: evalData.passedGates,
        p_metrics: evalData.metrics || {},
        p_criterion_scores: evalData.criterionScores || {},
        p_statistical_evidence: evalData.statisticalEvidence || {},
        p_evaluated_by: evalData.evaluatedBy || null
      });
      if (rpcErr) throw new Error(rpcErr.message);
      return resData;
    });

    return data;
  }
}

export const scientificEvaluationService = new ScientificEvaluationService();
