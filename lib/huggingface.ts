import "server-only";

import { InferenceClient } from "@huggingface/inference";

import { getHuggingFaceToken } from "@/lib/env";
import { SentimentServiceError } from "@/lib/sentiment-errors";
import type { Sentiment, SentimentResponse } from "@/types/sentiment";

export const SENTIMENT_MODEL =
  "distilbert/distilbert-base-uncased-finetuned-sst-2-english";
export const SENTIMENT_TIMEOUT_MS = 20_000;

type TextClassificationClient = Pick<InferenceClient, "textClassification">;

type SentimentAnalyzerDependencies = {
  token: string;
  timeoutMs: number;
  createClient: (token: string) => TextClassificationClient;
};

const DEFAULT_DEPENDENCIES: SentimentAnalyzerDependencies = {
  token: "",
  timeoutMs: SENTIMENT_TIMEOUT_MS,
  createClient: (token) => new InferenceClient(token),
};

function normalizeLabel(label: unknown): Sentiment | null {
  if (typeof label !== "string") {
    return null;
  }

  switch (label.toUpperCase()) {
    case "POSITIVE":
    case "LABEL_1":
      return "positive";
    case "NEGATIVE":
    case "LABEL_0":
      return "negative";
    default:
      return null;
  }
}

export function normalizeSentimentOutput(output: unknown): SentimentResponse {
  if (!Array.isArray(output) || output.length === 0) {
    throw new SentimentServiceError("malformed_provider_response");
  }

  const firstResult: unknown = output[0];

  if (typeof firstResult !== "object" || firstResult === null) {
    throw new SentimentServiceError("malformed_provider_response");
  }

  const { label, score } = firstResult as Record<string, unknown>;
  const sentiment = normalizeLabel(label);

  if (
    sentiment === null ||
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 1
  ) {
    throw new SentimentServiceError("malformed_provider_response");
  }

  return { sentiment, confidence: score };
}

export async function analyzeSentiment(
  feedback: string,
  overrides: Partial<SentimentAnalyzerDependencies> = {},
): Promise<SentimentResponse> {
  const token = overrides.token ?? getHuggingFaceToken();
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...overrides, token };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), dependencies.timeoutMs);

  try {
    const client = dependencies.createClient(dependencies.token);
    const output: unknown = await client.textClassification(
      {
        inputs: feedback,
        model: SENTIMENT_MODEL,
        provider: "hf-inference",
        parameters: { top_k: 1 },
      },
      {
        retry_on_error: false,
        signal: controller.signal,
      },
    );

    return normalizeSentimentOutput(output);
  } catch (error: unknown) {
    if (error instanceof SentimentServiceError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new SentimentServiceError("provider_timeout", { cause: error });
    }

    throw new SentimentServiceError("provider_failure", { cause: error });
  } finally {
    clearTimeout(timeoutId);
  }
}
