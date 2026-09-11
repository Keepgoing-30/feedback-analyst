import "server-only";

import { SentimentServiceError } from "@/lib/sentiment-errors";

export function getHuggingFaceToken(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const token = environment.HF_TOKEN?.trim();

  if (!token) {
    throw new SentimentServiceError("missing_configuration");
  }

  return token;
}
