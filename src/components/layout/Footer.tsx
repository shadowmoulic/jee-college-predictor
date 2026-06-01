import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[var(--border)] py-5 px-6 text-center text-sm text-[var(--text-secondary)]">
      <p>
        &copy; {new Date().getFullYear()} Nexus Predictor. Predictions are based on historical JoSAA data and do not guarantee admission.{" "}
        <Link
          href="/terms"
          className="text-[var(--brand)] font-semibold underline hover:opacity-80 transition-opacity"
        >
          Terms &amp; Conditions
        </Link>
      </p>
    </footer>
  );
}
