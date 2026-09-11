import "server-only";

export type SentimentServiceErrorCode =
  | "missing_configuration"
  | "provider_timeout"
  | "provider_failure"
  | "malformed_provider_response";

export class SentimentServiceError extends Error {
  constructor(
    public readonly code: SentimentServiceErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = "SentimentServiceError";
  }
}
