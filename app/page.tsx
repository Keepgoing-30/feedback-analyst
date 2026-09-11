import { VideoBackground } from "@/components/ui/VideoBackground";
import { FeedbackExperience } from "./FeedbackExperience";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <VideoBackground />

      <main className={styles.main}>
        <div className={styles.badgeWrap}>
          <span className={styles.badge}>AI-Powered Analysis</span>
        </div>

        <FeedbackExperience />
      </main>
    </div>
  );
}
