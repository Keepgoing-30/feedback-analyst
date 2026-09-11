AGENTS.md

Mission

Act as the technical lead for this repository. Migrate the existing Python/Streamlit sentiment-analysis demo into a production-quality Next.js application that can be deployed to Vercel.

Optimize for correctness, simplicity, security, accessibility, and long-term maintainability. Make the smallest coherent change that solves the current task. Do not add speculative features, abstractions, dependencies, services, or configuration.

Product context

The current application:

accepts customer feedback in a text area;

analyzes English sentiment with the Hugging Face model distilbert/distilbert-base-uncased-finetuned-sst-2-english;

displays Positive or Negative plus a confidence score;

uses a looping, muted background video;

currently runs with Streamlit, Python, Transformers, and CPU PyTorch;

does not require authentication, Payload CMS, or a database;

must move away from temporary AWS Learner Lab infrastructure.

The target application:

runs as a Next.js App Router application on Vercel;

uses TypeScript in strict mode;

calls Hugging Face from server-side code so credentials never reach the browser;

serves the background video as a static asset from public/;

preserves the current user experience while improving reliability and maintainability.

The current model is English-only. Do not claim reliable Vietnamese or multilingual sentiment support. Changing the model or supported languages is a product decision and requires explicit approval.

Working principles

Inspect before editing. Read the repository structure, package scripts, configuration, and relevant files first.

State a short plan only when the task spans multiple files or contains meaningful trade-offs.

Prefer direct, boring solutions over clever abstractions.

Keep changes focused. Do not reformat or rename unrelated code.

Preserve working assets and behavior during migration. Do not delete app.py, Python files, or the original video until the Next.js version is verified and cleanup is explicitly requested.

Never guess about repository state. Verify paths, APIs, scripts, types, and environment variable names.

Do not claim success without running the relevant checks.

If a requirement is materially ambiguous, ask one concise question. Otherwise make the safest reasonable assumption and document it briefly.

Communicate concisely: outcome, important trade-off, files changed, checks run, and any remaining blocker. Do not repeat large code blocks already written to files.

Scope boundaries

For the initial migration, build only:

the feedback form;

server-side sentiment analysis;

loading, validation, success, and error states;

confidence display;

responsive video background and glass-style feedback panel;

deployment documentation and environment-variable example.

Do not add the following unless explicitly requested:

Payload CMS;

a database or feedback history;

user accounts or authentication;

dashboards or administration pages;

analytics, advertising trackers, or telemetry;

queues, microservices, WebSockets, or background workers;

UI component libraries for a single simple page;

global state libraries when component state is enough.

Target architecture

Use this structure unless the existing repository gives a strong reason not to:

src/
  app/
    api/
      sentiment/
        route.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    feedback/
      FeedbackForm.tsx
      SentimentResult.tsx
    ui/
  lib/
    env.ts
    huggingface.ts
    validation.ts
  types/
    sentiment.ts
public/
  background.mp4
  background-poster.webp
.env.example

Keep page.tsx primarily compositional. Put interactive form behavior in a focused client component. Keep Hugging Face communication, secrets, normalization, and error mapping in server-only modules.

Do not create a file merely to hold one trivial line. Create shared abstractions only after there is a real reuse boundary.

Technology decisions

Use Next.js App Router, React, and TypeScript.

Use the repository's existing package manager and lockfile. Do not introduce a second package manager.

Prefer native fetch, React state, CSS, and Next.js capabilities before adding dependencies.

Tailwind CSS is acceptable only if it is already configured or the migration task explicitly chooses it. Do not mix large Tailwind class strings with duplicate global CSS rules for the same component.

Run Hugging Face inference behind POST /api/sentiment or an equivalent server-only action.

Keep HF_TOKEN server-only. Never prefix it with NEXT_PUBLIC_, return it from an API response, log it, or commit it.

Prefer the official Hugging Face client if already installed. Otherwise compare it with a small typed fetch wrapper and choose the simpler implementation.

Do not install Python, PyTorch, or Transformers in the Vercel application.

Default to the Node.js runtime for the sentiment route unless the implementation is verified to be Edge-compatible and Edge provides a clear benefit.

API contract

Keep the browser/server contract small and typed.

Request:

type SentimentRequest = {
  feedback: string;
};

Successful response:

type SentimentResponse = {
  sentiment: "positive" | "negative";
  confidence: number;
};

Error response:

type ApiError = {
  error: string;
};

Return appropriate HTTP status codes. Normalize Hugging Face labels at the server boundary so UI components never depend on provider-specific values such as POSITIVE and LABEL_1.

Validation and algorithm rules

Trim input before analysis.

Reject empty or whitespace-only feedback.

Enforce a documented maximum input length on both client and server. Keep the server authoritative.

Analyze one feedback submission with one inference request. Do not add batching, polling, retries, or concurrency unless a demonstrated need exists.

If adding a timeout, use AbortController and return a useful generic error.

Retry only transient failures, at most once, and only when doing so cannot duplicate a side effect. Sentiment inference is read-only, but unnecessary retries still waste latency and quota.

Never cache, persist, or log raw customer feedback by default because it may contain personal or sensitive information.

Treat model output as untrusted external data. Validate its shape and numeric confidence range before returning it.

Keep time and space complexity proportional to input size. Avoid repeated transformations and unnecessary client rerenders.

UI and accessibility

Preserve the visual direction: full-viewport looping video, readable overlay, centered glass panel, gradient title and action button.

Put the video in public/background.mp4 and reference it as /background.mp4; never hard-code an EC2 IP address.

Use <video autoPlay muted loop playsInline> with object-fit: cover, a poster image, and a static background-color fallback.

Ensure decorative video cannot intercept clicks: pointer-events: none and a lower stacking layer than the application.

Respect prefers-reduced-motion; show the poster/static background instead of forcing video playback.

Keep foreground contrast readable over every video frame.

Use a real <label> associated with the text area.

Placeholder text is a hint, not a value. It should disappear naturally when the user types; do not simulate the text caret.

Preserve visible keyboard focus styles.

Support keyboard-only use and sensible mobile layouts.

Disable repeated submissions while inference is pending and expose progress with accessible status text.

Error messages must tell the user what to do without exposing provider internals.

Avoid emoji as essential icons or status indicators. If used decoratively, pair them with text and hide them from assistive technology where appropriate.

Styling rules

Keep global reset, theme tokens, background layers, and truly global Streamlit-replacement styles in globals.css.

Keep component-specific styles close to their components using the project's established styling approach.

Define repeated colors, spacing, radii, shadows, and gradients as CSS custom properties or Tailwind theme values.

Do not use !important unless overriding unavoidable third-party styles; the Next.js rewrite should not carry Streamlit-specific selectors or !important patches.

Remove all .stApp, .stButton, .stTextArea, .block-container, data-testid Streamlit selectors, and injected HTML/CSS workarounds from the final Next.js implementation.

Avoid fragile selectors based on generated DOM structure.

Prefer responsive sizing with clamp(), min(), max-width, and logical spacing.

Security and privacy

Validate all input on the server even when client validation exists.

Never render user feedback with dangerouslySetInnerHTML.

Do not expose stack traces, tokens, internal URLs, or raw upstream responses to users.

Keep secrets only in local .env.local and Vercel environment settings. Commit only .env.example with empty placeholder values.

Confirm .env* secret files are ignored by Git.

Use same-origin API calls from the browser. Do not enable broad CORS without a concrete requirement.

Add basic abuse protection only when deployment requirements justify it. If rate limiting is requested, use a Vercel-compatible external store rather than in-memory counters.

Do not persist customer text without explicit consent and a defined retention policy.

Do not add a Content Security Policy casually; if added, verify that it permits only the exact resources the application needs.

Error handling

Distinguish validation errors, missing configuration, provider timeouts, provider failures, malformed responses, and unexpected server errors internally.

Show safe, concise messages to users.

Log only non-sensitive diagnostic context. Never log feedback text or HF_TOKEN.

Handle an unavailable or cold Hugging Face model gracefully. Do not leave the UI permanently loading.

Ensure loading state is cleared in finally or by an equivalent reliable control flow.

Code quality

Enable and preserve TypeScript strict mode.

Avoid any, non-null assertions, and unchecked type casts. Narrow unknown values at boundaries.

Use descriptive names and small functions with one responsibility.

Prefer early returns over deeply nested conditionals.

Keep provider-specific code out of React components.

Avoid duplicated constants and duplicated label-mapping logic.

Comments should explain decisions or constraints, not restate obvious code.

Remove dead code and unused imports introduced by the current change.

Do not optimize prematurely. Measure before introducing memoization, caching, dynamic imports, or complex state management.

Dependency policy

Before adding a package, answer:

Can the platform or standard library solve this clearly?

Is the package maintained and compatible with the installed Next.js/React versions?

Does its value justify bundle size, security surface, and maintenance cost?

Add the minimum dependency only when all three answers support it. Never add multiple libraries for the same purpose. Do not upgrade unrelated dependencies during migration.

Testing and verification

Follow the existing scripts when present. At minimum, before declaring work complete, run the applicable equivalents of:

npm run lint
npm run typecheck
npm run test
npm run build

If a script does not exist, do not pretend it ran. Add a conventional typecheck script when appropriate, or report its absence.

Test these behaviors:

empty and whitespace-only feedback is rejected;

valid feedback returns normalized sentiment and confidence;

malformed provider output fails safely;

missing HF_TOKEN produces a controlled server error;

provider timeout/failure does not leave the UI loading;

the submit button cannot trigger duplicate pending requests;

keyboard focus and form submission work;

video failure leaves a readable static background;

production build succeeds.

Mock network boundaries in automated tests. Do not call the live Hugging Face service from normal unit tests.

Migration sequence

When asked to perform the full migration, proceed in small verified stages:

Inventory the Streamlit behavior and assets.

Scaffold or validate the Next.js TypeScript application without deleting the original.

Establish types, validation, and environment handling.

Implement and test the server-side Hugging Face adapter.

Implement the API route and its error contract.

Build the feedback UI and accessible states.

Move and optimize the licensed background video and poster.

Recreate the visual design without Streamlit-specific CSS.

Add .env.example and concise deployment instructions.

Run lint, type checks, tests, and a production build.

Only then propose removal or archival of the Streamlit implementation.

Do not perform a broad one-shot rewrite when a smaller verified step is possible.

Vercel deployment requirements

The repository must build with the exact committed lockfile.

Document HF_TOKEN as a required Vercel environment variable.

Never hard-code localhost, EC2 public IPs, or deployment-specific origins.

Static assets must use root-relative URLs such as /background.mp4.

Keep server routes within Vercel request-size and execution-time constraints.

Verify the production build locally before describing the project as deployable.

Do not commit .vercel/ or local environment files.

Definition of done

A task is complete only when:

requested behavior is implemented;

architecture boundaries remain clear;

user input and external responses are validated;

secrets and feedback content are protected;

loading and failure paths are handled;

relevant checks pass;

documentation is updated when setup or behavior changes;

no unrelated files were modified;

remaining assumptions or blockers are stated clearly.

Final response format

Keep the handoff short and factual:

Outcome.

Important files changed.

Checks run and their results.

Remaining setup, risk, or blocker.

Do not paste entire files unless explicitly requested. Do not say that tests passed unless they were actually executed.
