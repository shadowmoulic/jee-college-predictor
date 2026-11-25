import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { JoSAARecord } from "@/app/data";
import { parse2026RoundCSV } from "./csv-parser";

let records: JoSAARecord[] | undefined;
let roundLabel: string | undefined;

export function getJosaa2026Data() {
  if (records) return records;
  const dir = join(process.cwd(), "data");
  records = readdirSync(dir).flatMap(file => {
    const match = /^2026_round([1-9]\d*)\.csv$/i.exec(file);
    return match ? parse2026RoundCSV(readFileSync(join(dir, file), "utf8"), Number(match[1])) : [];
  });
  return records;
}

export function get2026RoundLabel() {
  if (roundLabel) return roundLabel;
  const rounds = [...new Set(getJosaa2026Data().map(record => record.round))].sort((a, b) => a - b);
  if (!rounds.length) return "no available rounds";
  if (rounds.length === 1) return roundLabel = `Round ${rounds[0]}`;
  const last = rounds[rounds.length - 1];
  return roundLabel = last - rounds[0] + 1 === rounds.length
    ? `Rounds ${rounds[0]}–${last}`
    : `Rounds ${rounds.join(", ")}`;
}
