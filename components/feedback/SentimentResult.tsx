import type { SentimentResponse } from "@/types/sentiment";
import styles from "./SentimentResult.module.css";

type SentimentResultProps = {
  result: SentimentResponse;
};

export function SentimentResult({ result }: SentimentResultProps) {
  const isPositive = result.sentiment === "positive";
  const sentimentLabel = isPositive ? "Positive" : "Negative";
  const confidencePercent = result.confidence * 100;
  const formattedConfidence = `${confidencePercent.toFixed(2)}%`;

  return (
    <section className={styles.card} aria-labelledby="analysis-result-title">
      <h2 id="analysis-result-title" className={styles.resultLabel}>
        Analysis Result
      </h2>
      <p
        className={`${styles.sentiment} ${
          isPositive ? styles.positive : styles.negative
        }`}
      >
        <span className={styles.dot} aria-hidden="true" />
        {sentimentLabel}
      </p>
      <div className={styles.confidenceRow}>
        <span>Confidence</span>
        <span>{formattedConfidence}</span>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={`${sentimentLabel} sentiment confidence`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number(confidencePercent.toFixed(2))}
        aria-valuetext={formattedConfidence}
      >
        <span
          className={`${styles.progressFill} ${
            isPositive ? styles.positiveFill : styles.negativeFill
          }`}
          style={{ width: formattedConfidence }}
        />
      </div>
    </section>
  );
}
