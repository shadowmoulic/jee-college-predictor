import styles from "./resources.module.css";

export default function ChapterwiseBanner() {
  return (
    <aside className={styles.banner} aria-label="JEE preparation resource">
      <span><strong>Studying for JEE?</strong> Get Sayak’s chapter-wise resource for your revision plan.</span>
      <a href="https://tinyurl.com/JEEChapterwise">Download JEE chapter-wise <span aria-hidden="true">↗</span></a>
    </aside>
  );
}
