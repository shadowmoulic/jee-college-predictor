import styles from "@/app/page.module.css";

export default function BookCallButton() {
  return (
    <a
      href="https://tinyurl.com/SayakCall"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.bookCallButton}
      aria-label="Book a call with Sayak Moulic"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M4 3h4l2 5-3 2a16 16 0 0 0 7 7l2-3 5 2v4c0 1-1 2-2 2C9 21 3 15 2 5c0-1 1-2 2-2Z" />
      </svg>
      Book a call
    </a>
  );
}
