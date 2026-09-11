import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/sentiment/route";
import { analyzeSentiment } from "@/lib/huggingface";
import { SentimentServiceError } from "@/lib/sentiment-errors";

vi.mock("@/lib/huggingface", () => ({
  analyzeSentiment: vi.fn(),
}));

const mockedAnalyzeSentiment = vi.mocked(analyzeSentiment);

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/sentiment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/sentiment", () => {
  beforeEach(() => {
    mockedAnalyzeSentiment.mockReset();
  });

  it("returns 400 for invalid JSON", async () => {
    const request = new Request("http://localhost/api/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Request body must be valid JSON.",
    });
    expect(mockedAnalyzeSentiment).not.toHaveBeenCalled();
  });

  it.each([
    [{}, "Feedback must be a string."],
    [{ feedback: null }, "Feedback must be a string."],
    [{ feedback: "  " }, "Please enter some feedback."],
    [
      { feedback: "a".repeat(1_001) },
      "Feedback must be 1,000 characters or fewer.",
    ],
  ])("returns 400 for invalid feedback", async (body, error) => {
    const response = await POST(jsonRequest(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
    expect(mockedAnalyzeSentiment).not.toHaveBeenCalled();
  });

  it("trims feedback and returns normalized analysis", async () => {
    mockedAnalyzeSentiment.mockResolvedValue({
      sentiment: "positive",
      confidence: 0.98,
    });

    const response = await POST(jsonRequest({ feedback: "  Excellent!  " }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mockedAnalyzeSentiment).toHaveBeenCalledOnce();
    expect(mockedAnalyzeSentiment).toHaveBeenCalledWith("Excellent!");
    await expect(response.json()).resolves.toEqual({
      sentiment: "positive",
      confidence: 0.98,
    });
  });

  it.each([
    ["missing_configuration", 500, "Sentiment analysis is not configured."],
    [
      "provider_timeout",
      504,
      "Sentiment analysis took too long. Please try again.",
    ],
    [
      "provider_failure",
      502,
      "Sentiment analysis is temporarily unavailable. Please try again.",
    ],
    [
      "malformed_provider_response",
      502,
      "Sentiment analysis is temporarily unavailable. Please try again.",
    ],
  ] as const)("maps %s to a safe API error", async (code, status, error) => {
    mockedAnalyzeSentiment.mockRejectedValue(new SentimentServiceError(code));

    const response = await POST(jsonRequest({ feedback: "Good service" }));

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error });
  });

  it("hides unexpected server errors", async () => {
    mockedAnalyzeSentiment.mockRejectedValue(new Error("private details"));

    const response = await POST(jsonRequest({ feedback: "Good service" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Something went wrong. Please try again.",
    });
  });
});
