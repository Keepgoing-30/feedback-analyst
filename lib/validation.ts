export const MAX_FEEDBACK_LENGTH = 3_000;

export type FeedbackValidationResult =
  | { success: true; feedback: string }
  | { success: false; error: string };

export function validateFeedback(value: unknown): FeedbackValidationResult {
  if (typeof value !== "string") {
    return { success: false, error: "Feedback must be a string." };
  }

  const feedback = value.trim();

  if (feedback.length === 0) {
    return { success: false, error: "Please enter some feedback." };
  }

  if (feedback.length > MAX_FEEDBACK_LENGTH) {
    return {
      success: false,
      error: `Feedback must be ${MAX_FEEDBACK_LENGTH.toLocaleString("en-US")} characters or fewer.`,
    };
  }

  return { success: true, feedback };
}
