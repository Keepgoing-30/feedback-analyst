import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { ApiError, SentimentResponse } from "@/types/sentiment";
import {
  MAX_FEEDBACK_LENGTH,
  validateFeedback,
} from "@/lib/validation";
import { SentimentResult } from "./SentimentResult";
import styles from "./FeedbackForm.module.css";

type SubmissionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: SentimentResponse }
  | { status: "error"; message: string };

type FeedbackFormProps = {
  onResultChange?: (result: SentimentResponse | null) => void;
};

const FALLBACK_ERROR =
  "We couldn't analyze your feedback. Please try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSentimentResponse(value: unknown): value is SentimentResponse {
  if (!isRecord(value)) {
    return false;
  }

  const sentiment = value.sentiment;
  const confidence = value.confidence;

  return (
    (sentiment === "positive" || sentiment === "negative") &&
    typeof confidence === "number" &&
    Number.isFinite(confidence) &&
    confidence >= 0 &&
    confidence <= 1
  );
}

function isApiError(value: unknown): value is ApiError {
  return isRecord(value) && typeof value.error === "string";
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function FeedbackForm({ onResultChange }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState("");
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
  });
  const pendingRef = useRef(false);
  const isLoading = submission.status === "loading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pendingRef.current) {
      return;
    }

    const validation = validateFeedback(feedback);

    if (!validation.success) {
      setSubmission({ status: "error", message: validation.error });
      onResultChange?.(null);
      return;
    }

    pendingRef.current = true;
    setSubmission({ status: "loading" });
    onResultChange?.(null);

    try {
      const response = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: validation.feedback }),
      });
      const body = await readJson(response);

      if (!response.ok) {
        setSubmission({
          status: "error",
          message: isApiError(body) ? body.error : FALLBACK_ERROR,
        });
        onResultChange?.(null);
        return;
      }

      if (!isSentimentResponse(body)) {
        setSubmission({ status: "error", message: FALLBACK_ERROR });
        onResultChange?.(null);
        return;
      }

      setSubmission({ status: "success", result: body });
      onResultChange?.(body);
    } catch {
      setSubmission({ status: "error", message: FALLBACK_ERROR });
      onResultChange?.(null);
    } finally {
      pendingRef.current = false;
      setSubmission((current) =>
        current.status === "loading" ? { status: "idle" } : current,
      );
    }
  }

  function handleFeedbackKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-busy={isLoading}
      noValidate
    >
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor="customer-feedback">
          Customer feedback
        </label>
        <span
          className={styles.counter}
          id="feedback-counter"
          aria-live="polite"
        >
          {feedback.length}/{MAX_FEEDBACK_LENGTH}
        </span>
      </div>

      <textarea
        className={styles.textarea}
        id="customer-feedback"
        name="feedback"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        onKeyDown={handleFeedbackKeyDown}
        placeholder="Example: The product is excellent and delivery was fast."
        rows={6}
        maxLength={MAX_FEEDBACK_LENGTH}
        aria-describedby="feedback-counter feedback-status"
        disabled={isLoading}
      />

      <button className={styles.button} type="submit" disabled={isLoading}>
        <span aria-hidden="true">✦</span>
        {isLoading ? "Analyzing feedback..." : "Analyze sentiment"}
      </button>

      <div
        id="feedback-status"
        className={styles.status}
        role="status"
        aria-live="polite"
      >
        {isLoading ? "Analyzing feedback. Please wait." : null}
      </div>

      {submission.status === "error" ? (
        <p className={styles.error} role="alert">
          {submission.message}
        </p>
      ) : null}

      {submission.status === "success" && !onResultChange ? (
        <SentimentResult result={submission.result} />
      ) : null}
    </form>
  );
}
