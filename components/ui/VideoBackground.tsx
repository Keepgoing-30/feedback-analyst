import styles from "./VideoBackground.module.css";

export function VideoBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <video
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/background-poster.webp"
        tabIndex={-1}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
