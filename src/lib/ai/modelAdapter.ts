/**
 * OpenResearch Model Adapter Architecture
 * 
 * Provides unified model resolution and resilient fallback handling for Google Gemini & Gemma models.
 * Dynamically resolves requested Gemma 4 model IDs (e.g. 'gemma-4-31b-it', 'gemma-4-26b-a4b-it')
 * and provides fallback routing when Gemma 4 API identifiers are unprovisioned or unavailable.
 */

export interface ModelResolution {
  requestedModel: string;
  resolvedModel: string;
  secondaryModel?: string | null;
  isFallback: boolean;
  fallbackModel: string;
  fallbackReason?: string | null;
  notes: string;
}

export const OFFICIAL_GEMMA4_26B = 'gemma-4-26b-a4b-it';
export const OFFICIAL_GEMMA4_31B = 'gemma-4-31b-it';
export const DEFAULT_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3-flash-preview';

export const SUPPORTED_MODELS = [
  OFFICIAL_GEMMA4_26B,
  OFFICIAL_GEMMA4_31B,
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.8-pro',
  DEFAULT_FALLBACK_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemma-2-27b-it',
  'gemma-2-9b-it'
];

export function isSupportedModel(modelInput?: string): boolean {
  if (!modelInput) return true; // defaults to primary model
  const norm = modelInput.toLowerCase().trim();
  if (norm.includes('gemma-4') || norm.includes('gemma4') || norm.includes('gemma-26b') || norm.includes('gemma-31b')) {
    return true;
  }
  return SUPPORTED_MODELS.some(m => m.toLowerCase() === norm);
}

export function validateModelIdentifier(requestedModelInput?: string): { valid: boolean; error?: string } {
  if (!requestedModelInput) return { valid: true };
  if (!isSupportedModel(requestedModelInput)) {
    return {
      valid: false,
      error: `Unsupported model identifier '${requestedModelInput}'. Supported models: ${OFFICIAL_GEMMA4_26B}, ${OFFICIAL_GEMMA4_31B}, and fallback '${DEFAULT_FALLBACK_MODEL}'.`
    };
  }
  return { valid: true };
}

export function resolveModelIdentifier(requestedModelInput?: string): ModelResolution {
  const envModel = process.env.GEMMA_MODEL_ID || process.env.AI_MODEL_ID;
  const rawInput = requestedModelInput || envModel || OFFICIAL_GEMMA4_26B;
  const inputLower = rawInput.toLowerCase().trim();
  const activeFallback = process.env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;

  // Exact match for Gemma 4 26B
  if (rawInput === OFFICIAL_GEMMA4_26B || inputLower === OFFICIAL_GEMMA4_26B) {
    return {
      requestedModel: rawInput,
      resolvedModel: OFFICIAL_GEMMA4_26B,
      secondaryModel: OFFICIAL_GEMMA4_31B,
      isFallback: false,
      fallbackModel: activeFallback,
      fallbackReason: null,
      notes: `Directly attempting inference with official Gemma 4 MoE model '${OFFICIAL_GEMMA4_26B}'.`
    };
  }

  // Exact match for Gemma 4 31B
  if (rawInput === OFFICIAL_GEMMA4_31B || inputLower === OFFICIAL_GEMMA4_31B) {
    return {
      requestedModel: rawInput,
      resolvedModel: OFFICIAL_GEMMA4_31B,
      secondaryModel: OFFICIAL_GEMMA4_26B,
      isFallback: false,
      fallbackModel: activeFallback,
      fallbackReason: null,
      notes: `Attempting inference with official Gemma 4 31B model '${OFFICIAL_GEMMA4_31B}'.`
    };
  }

  // Alias or shorthand matching for Gemma 4 (e.g., 'gemma-4', 'gemma4')
  if (inputLower.includes('gemma-4') || inputLower.includes('gemma4')) {
    return {
      requestedModel: rawInput,
      resolvedModel: OFFICIAL_GEMMA4_26B,
      secondaryModel: OFFICIAL_GEMMA4_31B,
      isFallback: false,
      fallbackModel: activeFallback,
      fallbackReason: null,
      notes: `Mapped requested Gemma 4 alias '${rawInput}' to active official model '${OFFICIAL_GEMMA4_26B}'.`
    };
  }

  if (SUPPORTED_MODELS.some(m => m.toLowerCase() === inputLower)) {
    return {
      requestedModel: rawInput,
      resolvedModel: rawInput,
      secondaryModel: null,
      isFallback: false,
      fallbackModel: activeFallback,
      fallbackReason: null,
      notes: `Directly using configured model '${rawInput}'.`
    };
  }

  // Unrecognized identifier fallback
  return {
    requestedModel: rawInput,
    resolvedModel: activeFallback,
    secondaryModel: null,
    isFallback: true,
    fallbackModel: activeFallback,
    fallbackReason: `Requested model identifier '${rawInput}' is not recognized. Mapped to default '${activeFallback}'.`,
    notes: `Requested identifier '${rawInput}' mapped to '${activeFallback}' by Model Adapter.`
  };
}
