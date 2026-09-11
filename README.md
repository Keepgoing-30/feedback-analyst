# Feedback Sentiment Analyzer

A production-ready Next.js application for analyzing English customer feedback sentiment.

The app accepts a single feedback message, sends it to a server-side API route, and returns a normalized `positive` or `negative` result with a confidence score. Sentiment inference uses Hugging Face's `distilbert/distilbert-base-uncased-finetuned-sst-2-english` model.

## Features

- Customer feedback form with client-side validation and loading states
- Server-side sentiment analysis through `POST /api/sentiment`
- Hugging Face credentials kept out of the browser
- Normalized API response: `positive` or `negative`
- Confidence score display
- Responsive glass-style interface over a looping video background
- Reduced-motion and static-poster fallback support
- Automated tests for validation, API behavior, and provider response handling

## Tech Stack

- Next.js App Router
- React
- TypeScript in strict mode
- Vitest and Testing Library
- Hugging Face Inference API
- Vercel-ready static assets and server route

## Project Structure

```text
app/
  api/sentiment/route.ts     # Server-side sentiment API route
  FeedbackExperience.tsx     # Client experience wrapper
  globals.css                # Global styles and theme tokens
  layout.tsx                 # Root application layout
  page.tsx                   # Home page composition
components/
  feedback/                  # Feedback form and sentiment result UI
  ui/                        # Shared UI elements
lib/
  env.ts                     # Server-only environment access
  huggingface.ts             # Hugging Face adapter and output normalization
  validation.ts              # Shared feedback validation
types/
  sentiment.ts               # API and sentiment types
public/
  background.mp4             # Video background
  background-poster.webp     # Reduced-motion/loading fallback
```

## Requirements

- Node.js 20.9 or later
- pnpm
- Hugging Face access token with inference access

## Environment Variables

Create a local environment file from the example:

```bash
cp .env.example .env.local
```

Then set:

```dotenv
HF_TOKEN=your_hugging_face_token
```

Keep `HF_TOKEN` server-only. Do not rename it with a `NEXT_PUBLIC_` prefix, log it, or commit `.env.local`.

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Tests mock the Hugging Face boundary, so normal test runs do not call the live provider or consume inference quota.

## API Contract

Endpoint:

```http
POST /api/sentiment
```

Request body:

```json
{
  "feedback": "The product is excellent and delivery was fast."
}
```

Successful response:

```json
{
  "sentiment": "positive",
  "confidence": 0.9987
}
```

Error response:

```json
{
  "error": "Please enter some feedback."
}
```

Feedback is trimmed before analysis. Empty feedback is rejected, and submissions are limited to 1,000 characters on both the client and server.

## Deployment

This project is ready to deploy on Vercel.

1. Import the repository into Vercel.
2. Add `HF_TOKEN` to the Vercel project environment variables.
3. Deploy with the committed lockfile.
4. After deployment, test a successful submission, an empty submission, the video background, and the reduced-motion fallback.

Static assets are served from `public/`:

- `/background.mp4`
- `/background-poster.webp`

Do not hard-code local, EC2, or deployment-specific URLs for these assets.

## Privacy and Model Limits

Feedback is sent to the server for a single inference request. The application does not intentionally cache, persist, or log raw feedback text.

The configured SST-2 model is English-only. Results should not be presented as reliable for Vietnamese or other non-English feedback without an approved model change.

Provider availability, latency, and usage limits depend on the configured Hugging Face account.
