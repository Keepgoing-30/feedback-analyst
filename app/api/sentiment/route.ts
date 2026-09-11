import { NextResponse } from "next/server";

import { analyzeSentiment } from "@/lib/huggingface";
import { SentimentServiceError } from "@/lib/sentiment-errors";
import { validateFeedback } from "@/lib/validation";
import type { ApiError, SentimentResponse } from "@/types/sentiment";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

function errorResponse(error: string, status: number) {
  return NextResponse.json<ApiError>(
    { error },
    { status, headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  if (typeof body !== "object" || body === null || !("feedback" in body)) {
    return errorResponse("Feedback must be a string.", 400);
  }

  const validation = validateFeedback(
    (body as Record<string, unknown>).feedback,
  );

  if (!validation.success) {
    return errorResponse(validation.error, 400);
  }

  try {
    const result = await analyzeSentiment(validation.feedback);
    return NextResponse.json<SentimentResponse>(result, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (error: unknown) {
    if (error instanceof SentimentServiceError) {
      switch (error.code) {
        case "missing_configuration":
          return errorResponse("Sentiment analysis is not configured.", 500);
        case "provider_timeout":
          return errorResponse(
            "Sentiment analysis took too long. Please try again.",
            504,
          );
        case "provider_failure":
        case "malformed_provider_response":
          return errorResponse(
            "Sentiment analysis is temporarily unavailable. Please try again.",
            502,
          );
      }
    }

    return errorResponse("Something went wrong. Please try again.", 500);
  }
}
