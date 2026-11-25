import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, JsonLd } from "@/components/seo/JsonLd";
import { SITE_CREATOR, siteCreatorId, siteUrl } from "@/lib/site";
import styles from "../cutoffs/cutoffs.module.css";

const title = "One-on-one JEE Counselling with Sayak Moulic";
const description = "Book a call with Sayak Moulic to discuss your JEE preparation, JoSAA preference list, or IIT and NIT choices.";
const url = siteUrl("/mentorship");
const booking = "https://tinyurl.com/SayakCall";

export const metadata: Metadata = { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };

const reviews = [
  ["", "2026-07-06", "6 Jul 2026", "It was very helpful, really cleared up my doubts and provided a strategic way to approach things."],
  ["Taniya Alvi", "2026-05-30", "30 May 2026", "The Weightage Analysis Was Clear,Useful,It Helped Me Focus On Important IAT Topics. ThankYou."],
  ["S R Sivasruthy", "2026-05-27", "27 May 2026", "I didn't have any idea about the chapter-wise weightage until I reviewed the Google Sheets provided by Sayak brother. I really loved it and appreciate the efforts put in by the entire team. Thank you, brother!!!"],
  ["Shalini Gupta", "2026-05-13", "13 May 2026", "Really cleared my doubts. I think ab i can do really better for my upcoming exams. Can't thank him enough"],
  ["Ritthik Samanta", "2026-05-12", "12 May 2026", "Sayak bhaiya really helped me with giving clarity on what to do for jee adv. I did learn a lot lol 😅 and yes really grateful to him"],
  ["Dhruv", "2026-05-11", "11 May 2026", "It was good"],
];

export default function MentorshipPage() {
  return (
    <main className={styles.main}>
      <Breadcrumbs items={[["Home", "/"], ["JEE Counselling", "/mentorship"]]} />
      <JsonLd data={{
        "@type": "WebPage", url, name: title, description,
        mainEntity: {
          "@type": "Service", name: "One-on-one JEE counselling",
          provider: { "@id": siteCreatorId() }, url: booking,
        },
      }} />
      <h1>One-on-one JEE counselling with Sayak Moulic</h1>
      <p>Bring your questions about JEE prep, IIT life, or which branches to put on your JoSAA list. If you already have a rank and a few college options, bring those too so we can spend the call on the trade-offs specific to you.</p>
      <p><strong>4.5 out of 5</strong> booking rating · <strong>124 bookings</strong></p>
      <p className={styles.links}><a href={booking}><strong>Book a one-on-one call</strong></a><a href={SITE_CREATOR.profile}>Watch Sayak on YouTube</a></p>
      <h2>What you can bring to a call</h2>
      <p>For an admissions conversation, bring your exam, rank, seat category and the two or three options you keep comparing. Think through what you actually want to study, how far you can travel, and what your budget looks like. You can start with the <Link href="/">JEE College Predictor</Link> or pull up an exact branch in the <Link href="/cutoffs/2026">JoSAA 2026 cutoff explorer</Link>.</p>
      <p>For a preparation conversation, bring a recent mock breakdown and the chapters where you feel stuck. The <a href="https://tinyurl.com/JEEChapterwise">chapter-wise JEE resource</a> gives you somewhere to start before the call.</p>
      <h2>What students said about counselling and study resources</h2>
      <div className={styles.reviewGrid}>
        {reviews.map(([name, date, label, quote]) => (
          <figure key={date} className={styles.review}>
            <div aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>{quote}</blockquote>
            <figcaption>{name || "Student"} · <time dateTime={date}>{label}</time></figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
