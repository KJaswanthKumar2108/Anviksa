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

export function resolveModelIdentifier(requestedModelInput?: string): ModelResolution {
  const envModel = process.env.GEMMA_MODEL_ID || process.env.AI_MODEL_ID;
  const rawInput = requestedModelInput || envModel || 'gemma-4-26b-a4b-it';
  const inputLower = rawInput.toLowerCase().trim();

  // Official Gemma 4 model identifiers according to official Google API docs
  // (https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)
  const OFFICIAL_GEMMA4_26B = 'gemma-4-26b-a4b-it';
  const OFFICIAL_GEMMA4_31B = 'gemma-4-31b-it';
  const DEFAULT_FALLBACK_MODEL = 'gemini-3.8-flash';

  // Exact match for Gemma 4 26B
  if (rawInput === OFFICIAL_GEMMA4_26B) {
    return {
      requestedModel: rawInput,
      resolvedModel: OFFICIAL_GEMMA4_26B,
      secondaryModel: OFFICIAL_GEMMA4_31B,
      isFallback: false,
      fallbackModel: DEFAULT_FALLBACK_MODEL,
      fallbackReason: null,
      notes: `Directly attempting inference with official Gemma 4 MoE model '${OFFICIAL_GEMMA4_26B}'.`
    };
  }

  // Exact match for Gemma 4 31B
  if (rawInput === OFFICIAL_GEMMA4_31B) {
    return {
      requestedModel: rawInput,
      resolvedModel: OFFICIAL_GEMMA4_31B,
      secondaryModel: OFFICIAL_GEMMA4_26B,
      isFallback: false,
      fallbackModel: DEFAULT_FALLBACK_MODEL,
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
      fallbackModel: DEFAULT_FALLBACK_MODEL,
      fallbackReason: null,
      notes: `Mapped requested Gemma 4 alias '${rawInput}' to active official model '${OFFICIAL_GEMMA4_26B}'.`
    };
  }

  // Exact known Gemini or Gemma models
  const KNOWN_MODELS = [
    'gemini-3.8-flash',
    'gemini-3.6-flash',
    'gemini-3.1-pro-preview',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemma-2-27b-it',
    'gemma-2-9b-it'
  ];

  if (KNOWN_MODELS.includes(rawInput)) {
    return {
      requestedModel: rawInput,
      resolvedModel: rawInput,
      secondaryModel: null,
      isFallback: false,
      fallbackModel: DEFAULT_FALLBACK_MODEL,
      fallbackReason: null,
      notes: `Directly using configured model '${rawInput}'.`
    };
  }

  // Unrecognized identifier fallback
  return {
    requestedModel: rawInput,
    resolvedModel: DEFAULT_FALLBACK_MODEL,
    secondaryModel: null,
    isFallback: true,
    fallbackModel: DEFAULT_FALLBACK_MODEL,
    fallbackReason: `Requested model identifier '${rawInput}' is not recognized. Mapped to default '${DEFAULT_FALLBACK_MODEL}'.`,
    notes: `Requested identifier '${rawInput}' mapped to '${DEFAULT_FALLBACK_MODEL}' by Model Adapter.`
  };
}
