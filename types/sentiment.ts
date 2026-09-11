export type Sentiment = "positive" | "negative";

export type SentimentRequest = {
  feedback: string;
};

export type SentimentResponse = {
  sentiment: Sentiment;
  confidence: number;
};

export type ApiError = {
  error: string;
};
