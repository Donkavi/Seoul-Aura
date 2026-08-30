/**
 * Minimal REST client for the Gemini API.
 *
 * Deliberately dependency-free — the generateContent endpoint is a single POST,
 * and going direct keeps the bundle small and the request shape visible.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

export interface GeminiInlineData {
  mimeType: string;
  /** Raw base64 (no `data:` prefix). */
  data: string;
}

export interface GeminiFunctionCall {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
}

export interface GeminiPart {
  text?: string;
  inlineData?: GeminiInlineData;
  functionCall?: GeminiFunctionCall;
  functionResponse?: {
    id?: string;
    name: string;
    response: Record<string, unknown>;
  };
  /** Opaque reasoning token echoed back verbatim on the next turn (Gemini 3+). */
  thoughtSignature?: string;
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface GenerateOptions {
  system: string;
  contents: GeminiContent[];
  tools?: GeminiFunctionDeclaration[];
  /**
   * "NONE" keeps the declarations visible (so prior function calls in the history
   * still make sense) while forbidding new ones — the correct way to demand a
   * text answer. Dropping `tools` outright can yield an empty candidate.
   * "ANY" forces a call, optionally narrowed by `allowedFunctionNames`.
   */
  toolMode?: "AUTO" | "NONE" | "ANY";
  /** Restricts which functions "ANY" may choose from. */
  allowedFunctionNames?: string[];
  /**
   * Overrides the primary model. Free-tier request quotas are counted per model,
   * so a cheap internal check can run elsewhere and leave the conversation
   * model's daily allowance for actual shoppers.
   */
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
}

export interface GeminiResult {
  parts: GeminiPart[];
  text: string;
  functionCalls: GeminiFunctionCall[];
  finishReason?: string;
}

export class GeminiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "GeminiError";
  }
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY is not configured", 500);
  return key;
}

/** Strips a `data:image/png;base64,` prefix if the caller passed a full data URL. */
export function stripDataUrl(value: string): string {
  const comma = value.indexOf(",");
  return value.startsWith("data:") && comma !== -1 ? value.slice(comma + 1) : value;
}

/**
 * Models the primary falls back to when it is overloaded or rate limited.
 *
 * Free-tier request quotas are counted per model, so falling back to a *different*
 * model is what actually gets a rate-limited shopper an answer — a shopper
 * mid-question should get a slightly older model rather than an apology.
 */
const FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS ??
  // Free-tier request quotas are counted per model per day, so each extra model
  // here is an extra daily allowance. Ordered best-quality first; all of these
  // were verified to support function calling, which the assistant depends on.
  "gemini-2.5-flash,gemini-3-flash-preview,gemini-3.5-flash-lite,gemini-3.1-flash-lite"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

/** 429/503 mean "busy, come back" — everything else is a real failure. */
function isTransient(status: number): boolean {
  return status === 429 || status === 500 || status === 503;
}

async function postOnce(
  model: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<Response> {
  return fetch(`${API_BASE}/${model}:generateContent?key=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

export async function generateContent(opts: GenerateOptions): Promise<GeminiResult> {
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: opts.contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 2048,
    },
  };

  if (opts.tools?.length) {
    body.tools = [{ functionDeclarations: opts.tools }];
    if (opts.toolMode) {
      body.toolConfig = {
        functionCallingConfig: {
          mode: opts.toolMode,
          ...(opts.allowedFunctionNames?.length
            ? { allowedFunctionNames: opts.allowedFunctionNames }
            : {}),
        },
      };
    }
  }

  // Primary twice (load spikes are short), then each fallback model in turn.
  const primary = opts.model ?? GEMINI_MODEL;
  const attempts: Array<{ model: string; delayMs: number }> = [
    { model: primary, delayMs: 0 },
    { model: primary, delayMs: 700 },
    ...FALLBACK_MODELS.filter((m) => m !== primary).map((model) => ({ model, delayMs: 300 })),
  ];

  let lastError: GeminiError | null = null;
  let res: Response | null = null;

  for (const attempt of attempts) {
    if (attempt.delayMs) await new Promise((r) => setTimeout(r, attempt.delayMs));

    const candidate = await postOnce(attempt.model, body, opts.signal);
    if (candidate.ok) {
      // Worth surfacing: a reply served by a fallback is a downgraded reply, and
      // otherwise the only symptom is quietly worse answers.
      if (attempt.model !== primary) {
        console.warn(`Gemini fell back to ${attempt.model} (${primary} unavailable)`);
      }
      res = candidate;
      break;
    }

    const detail = await candidate.text().catch(() => "");
    lastError = new GeminiError(
      `Gemini request failed on ${attempt.model} (${candidate.status}): ${detail.slice(0, 300)}`,
      candidate.status
    );
    if (!isTransient(candidate.status)) throw lastError;
  }

  if (!res) throw lastError ?? new GeminiError("Gemini request failed", 503);

  const json = await res.json();
  const candidate = json?.candidates?.[0];
  const parts: GeminiPart[] = candidate?.content?.parts ?? [];

  return {
    parts,
    text: parts
      .map((p) => p.text ?? "")
      .join("")
      .trim(),
    functionCalls: parts
      .filter((p): p is GeminiPart & { functionCall: GeminiFunctionCall } => !!p.functionCall)
      .map((p) => p.functionCall),
    finishReason: candidate?.finishReason,
  };
}
