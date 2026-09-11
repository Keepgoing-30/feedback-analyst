import type { InferenceClient } from "@huggingface/inference";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  analyzeSentiment,
  normalizeSentimentOutput,
  SENTIMENT_MODEL,
} from "@/lib/huggingface";
import { SentimentServiceError } from "@/lib/sentiment-errors";

describe("normalizeSentimentOutput", () => {
  it.each([
    ["POSITIVE", "positive"],
    ["positive", "positive"],
    ["LABEL_1", "positive"],
    ["NEGATIVE", "negative"],
    ["negative", "negative"],
    ["LABEL_0", "negative"],
  ] as const)("normalizes %s", (label, sentiment) => {
    expect(normalizeSentimentOutput([{ label, score: 0.91 }])).toEqual({
      sentiment,
      confidence: 0.91,
    });
  });

  it.each([
    undefined,
    null,
    {},
    [],
    [null],
    [{ label: "NEUTRAL", score: 0.7 }],
    [{ label: "POSITIVE", score: "0.7" }],
    [{ label: "POSITIVE", score: Number.NaN }],
    [{ label: "POSITIVE", score: -0.1 }],
    [{ label: "POSITIVE", score: 1.1 }],
  ])("rejects malformed output", (output) => {
    expect(() => normalizeSentimentOutput(output)).toThrowError(
      expect.objectContaining<Partial<SentimentServiceError>>({
        code: "malformed_provider_response",
      }),
    );
  });
});

describe("analyzeSentiment", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends one inference request with the fixed model and safe options", async () => {
    const textClassification = vi.fn<InferenceClient["textClassification"]>(
      async () => [{ label: "POSITIVE", score: 0.87 }],
    );
    const createClient = vi.fn(() => ({ textClassification }));

    await expect(
      analyzeSentiment("A great product.", {
        token: "hf_test",
        createClient,
      }),
    ).resolves.toEqual({ sentiment: "positive", confidence: 0.87 });

    expect(createClient).toHaveBeenCalledOnce();
    expect(createClient).toHaveBeenCalledWith("hf_test");
    expect(textClassification).toHaveBeenCalledOnce();
    expect(textClassification).toHaveBeenCalledWith(
      {
        inputs: "A great product.",
        model: SENTIMENT_MODEL,
        provider: "hf-inference",
        parameters: { top_k: 1 },
      },
      expect.objectContaining({
        retry_on_error: false,
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("maps provider failures without exposing the original error", async () => {
    const textClassification = vi.fn<InferenceClient["textClassification"]>(
      async () => {
        throw new Error("provider details");
      },
    );

    await expect(
      analyzeSentiment("A great product.", {
        token: "hf_test",
        createClient: () => ({ textClassification }),
      }),
    ).rejects.toMatchObject({ code: "provider_failure" });
  });

  it("aborts and maps a request that exceeds the timeout", async () => {
    vi.useFakeTimers();

    const textClassification = vi.fn<InferenceClient["textClassification"]>(
      (_args, options) =>
        new Promise<never>((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        }),
    );
    const pendingResult = analyzeSentiment("A great product.", {
      token: "hf_test",
      timeoutMs: 50,
      createClient: () => ({ textClassification }),
    });
    const expectation = expect(pendingResult).rejects.toMatchObject({
      code: "provider_timeout",
    });

    await vi.advanceTimersByTimeAsync(50);
    await expectation;
  });
});
