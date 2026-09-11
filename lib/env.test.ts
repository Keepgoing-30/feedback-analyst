import { describe, expect, it } from "vitest";

import { getHuggingFaceToken } from "@/lib/env";
import { SentimentServiceError } from "@/lib/sentiment-errors";

describe("getHuggingFaceToken", () => {
  it.each([undefined, "", "  "])("rejects a missing token", (HF_TOKEN) => {
    expect(() => getHuggingFaceToken({ HF_TOKEN })).toThrowError(
      expect.objectContaining<Partial<SentimentServiceError>>({
        code: "missing_configuration",
      }),
    );
  });

  it("trims and returns a configured token", () => {
    expect(getHuggingFaceToken({ HF_TOKEN: "  hf_example  " })).toBe(
      "hf_example",
    );
  });
});
