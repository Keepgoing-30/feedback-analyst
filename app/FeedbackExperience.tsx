"use client";

import { useState } from "react";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { SentimentResult } from "@/components/feedback/SentimentResult";
import type { SentimentResponse } from "@/types/sentiment";
import styles from "./page.module.css";

export function FeedbackExperience() {
  const [result, setResult] = useState<SentimentResponse | null>(null);

  return (
    <>
      <div className={styles.experienceStack}>
        <section className={styles.panel} aria-labelledby="page-title">
          <header className={styles.header}>
            <h1 id="page-title" className={styles.title}>
              Customer Feedback Analyzer
            </h1>
            <p className={styles.subtitle}>
              Enter customer feedback and let AI analyze its sentiment in real
              time.
            </p>
          </header>

          <FeedbackForm onResultChange={setResult} />
        </section>

        {result ? (
          <div className={styles.resultWrap}>
            <SentimentResult result={result} />
          </div>
        ) : null}
      </div>

      <footer className={styles.footer}>
        POWERED BY DISTILBERT · SST-2 FINE-TUNED MODEL
      </footer>
    </>
  );
}
