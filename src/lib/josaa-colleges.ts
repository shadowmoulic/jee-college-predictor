import { getInstituteId, type JoSAARecord } from "@/app/data";
import { getJosaa2026Data } from "./josaa-2026";
import { getJosaaData } from "./josaa-data";

let campuses: Map<string, JoSAARecord[]> | undefined;

export function getJosaaColleges() {
  if (campuses) return campuses;
  campuses = new Map();
  for (const source of [getJosaa2026Data(), getJosaaData()]) {
    const ids = new Map<string, string>();
    for (const record of source) {
      let id = ids.get(record.institute);
      if (!id) {
        id = getInstituteId(record.institute);
        if (!id) continue;
        ids.set(record.institute, id);
      }
      const entries = campuses.get(id);
      if (entries) entries.push(record);
      else campuses.set(id, [record]);
    }
  }
  return campuses;
}
