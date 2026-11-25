import Link from "next/link";
import { TOP_5_IITS, getInstituteId } from "@/app/data";
import { SITE_CREATOR } from "@/lib/site";
import copy from "./admission-copy.json";
import styles from "./admission-guide.module.css";

const highlightedIits = new Set([...TOP_5_IITS].map(getInstituteId));
const selectiveNits = /(?:tiruchirappalli|trichy|surathkal|warangal|rourkela|calicut|allahabad)/i;

export function AdmissionGuide({ name, type, branch, mode, other, links }: {
  name: string;
  type?: string;
  branch?: string;
  mode: "comparison" | "history" | "rounds" | "college";
  other?: { name: string; type?: string };
  links: { path: string; title: string }[];
}) {
  function cohort(campus: string, group?: string) {
    if (group === "IIT") {
      return highlightedIits.has(getInstituteId(campus)) || /\bIIT (Bombay|Delhi|Madras|Kanpur|Kharagpur)\b/i.test(campus)
        ? copy.topIit : copy.otherIit;
    }
    if (group === "NIT") return selectiveNits.test(campus) ? copy.selectiveNit : copy.otherNit;
    return copy.other;
  }
  const advice = type === "NIT" && name === "NITs" ? [copy.selectiveNit[0], copy.otherNit[1]] : cohort(name, type);
  const otherAdvice = other && cohort(other.name, other.type);
  const modeCopy = mode === "college" ? copy.history : copy[mode];

  return (
    <section className={styles.guide} aria-labelledby="shortlist-guide">
      <h2 id="shortlist-guide">{branch ? `Shortlisting ${branch}` : `How to shortlist ${name}`}{other ? ` and ${other.name}` : ""}</h2>
      <p>Use the ranks above to decide which choices deserve a closer look. {branch ? `Start with the B.Tech curriculum for ${branch}, then use the JoSAA ranks to see where to spend your research time.` : `Start with the branches you would actually study at ${name}.`} A small rank difference is rarely enough information to settle a four-year decision.</p>
      {modeCopy.map(text => <p key={text}>{text}</p>)}
      <h3>What to check at {name}</h3>
      {advice.map(text => <p key={text}>{text}</p>)}
      {other && otherAdvice && otherAdvice !== advice && (
        <><h3>What to check at {other.name}</h3><p>{otherAdvice[0]}</p></>
      )}
      <h3>Build your JoSAA preference list</h3>
      {branch && <p>{copy.branch[0]}</p>}
      <ol>{copy.core.map(text => <li key={text}>{text}</li>)}</ol>
      <p>Before you lock the list, ask a current student one concrete question the brochure cannot answer. For example, ask how many hours a typical lab takes, whether second-year students can join projects, or what the hostel commute is like. Write down what matters to you beside each answer. That gives you something you can use when two options have similar cutoffs and neither has a clear advantage in the published numbers.</p>
      {links.length > 0 && <>
        <h3>Keep researching your options</h3>
        <ul className={styles.links}>
          {links.map(link => <li key={link.path}><Link href={link.path}>{link.title}</Link></li>)}
        </ul>
      </>}
      <p className={styles.author}>For IIT life and JEE guidance, see <a href={SITE_CREATOR.profile}>Sayak Moulic on YouTube</a>. For help with your own shortlist, <Link href="/mentorship">see Sayak’s one-on-one counselling</Link>.</p>
    </section>
  );
}
