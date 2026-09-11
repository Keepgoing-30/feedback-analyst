import { describe, expect, it } from "vitest";

import { MAX_FEEDBACK_LENGTH, validateFeedback } from "@/lib/validation";

describe("validateFeedback", () => {
  it.each(["", "   ", "\n\t"])("rejects empty feedback", (value) => {
    expect(validateFeedback(value)).toEqual({
      success: false,
      error: "Please enter some feedback.",
    });
  });

  it.each([undefined, null, 42, {}, []])(
    "rejects non-string input",
    (value) => {
      expect(validateFeedback(value)).toEqual({
        success: false,
        error: "Feedback must be a string.",
      });
    },
  );

  it("trims valid feedback", () => {
    expect(validateFeedback("  The service was excellent. \n")).toEqual({
      success: true,
      feedback: "The service was excellent.",
    });
  });

  it("accepts feedback at the maximum length", () => {
    const feedback = "a".repeat(MAX_FEEDBACK_LENGTH);

    expect(validateFeedback(feedback)).toEqual({ success: true, feedback });
  });

  it("rejects feedback over the maximum length after trimming", () => {
    expect(validateFeedback(` ${"a".repeat(MAX_FEEDBACK_LENGTH + 1)} `)).toEqual(
      {
        success: false,
        error: "Feedback must be 1,000 characters or fewer.",
      },
    );
  });
});
