// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MAX_FEEDBACK_LENGTH } from "@/lib/validation";
import { FeedbackForm } from "./FeedbackForm";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderForm() {
  render(<FeedbackForm />);

  return {
    feedback: screen.getByRole("textbox", { name: /customer feedback/i }),
    submit: screen.getByRole("button", { name: /analyze sentiment/i }),
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("FeedbackForm", () => {
  it("rejects empty and whitespace-only feedback without a request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { feedback, submit } = renderForm();

    fireEvent.click(submit);
    expect(screen.getByRole("alert").textContent).toContain(
      "Please enter some feedback.",
    );

    fireEvent.change(feedback, { target: { value: "   \n  " } });
    fireEvent.click(submit);

    expect(screen.getByRole("alert").textContent).toContain(
      "Please enter some feedback.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects feedback over the client limit", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { feedback, submit } = renderForm();

    fireEvent.change(feedback, {
      target: { value: "a".repeat(MAX_FEEDBACK_LENGTH + 1) },
    });
    fireEvent.click(submit);

    expect(screen.getByRole("alert").textContent).toContain(
      `Feedback must be ${MAX_FEEDBACK_LENGTH.toLocaleString("en-US")} characters or fewer.`,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trims valid feedback and renders a normalized result", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ sentiment: "positive", confidence: 0.934 }));
    vi.stubGlobal("fetch", fetchMock);
    const { feedback, submit } = renderForm();

    fireEvent.change(feedback, { target: { value: "  Excellent service.  " } });
    fireEvent.click(submit);

    await screen.findByText("Positive");
    expect(screen.getByText("93.40%")).toBeTruthy();
    expect(
      screen
        .getByRole("progressbar", {
          name: "Positive sentiment confidence",
        })
        .getAttribute("aria-valuenow"),
    ).toBe("93.4");
    expect(fetchMock).toHaveBeenCalledWith("/api/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: "Excellent service." }),
    });
  });

  it("submits with Enter and keeps Shift+Enter for new lines", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ sentiment: "positive", confidence: 0.81 }));
    vi.stubGlobal("fetch", fetchMock);
    const { feedback } = renderForm();
    const user = userEvent.setup();

    await user.type(feedback, "First line");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.type(feedback, "Second line");

    expect(feedback).toHaveValue("First line\nSecond line");
    expect(fetchMock).not.toHaveBeenCalled();

    await user.keyboard("{Enter}");

    await screen.findByText("Positive");
    expect(fetchMock).toHaveBeenCalledWith("/api/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: "First line\nSecond line" }),
    });
  });

  it("prevents duplicate submissions while a request is pending", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(pendingRequest);
    vi.stubGlobal("fetch", fetchMock);
    const { feedback, submit } = renderForm();

    fireEvent.change(feedback, { target: { value: "Great product" } });
    fireEvent.click(submit);

    const pendingButton = screen.getByRole("button", {
      name: /analyzing feedback/i,
    });
    expect(pendingButton.hasAttribute("disabled")).toBe(true);
    const form = pendingButton.closest("form");
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveRequest?.(
      jsonResponse({ sentiment: "positive", confidence: 0.81 }),
    );
    await screen.findByText("Positive");
  });

  it("shows the API error and clears the loading state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "Sentiment analysis is temporarily unavailable." }, 502),
      ),
    );
    const { feedback, submit } = renderForm();

    fireEvent.change(feedback, { target: { value: "Not great" } });
    fireEvent.click(submit);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Sentiment analysis is temporarily unavailable.",
    );
    expect(
      screen
        .getByRole("button", { name: /analyze sentiment/i })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("shows a safe network error and clears the loading state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { feedback, submit } = renderForm();

    fireEvent.change(feedback, { target: { value: "Could be better" } });
    fireEvent.click(submit);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "We couldn't analyze your feedback. Please try again.",
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: /analyze sentiment/i })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
  });
});
