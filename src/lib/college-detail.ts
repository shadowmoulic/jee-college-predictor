import { getJosaaColleges } from "./josaa-colleges";
import type { JoSAARecord } from "@/app/data";
import { getPlacementForCollege } from "@/lib/placement-data";

export function getCollegeDetail(id: string, year?: number) {
  const campus = getJosaaColleges().get(id);
  const records = year ? campus?.filter(row => row.year === year) : campus;
  if (!records?.length) return null;
  const matchedRecord = records[0];
  const instituteName = matchedRecord.institute;
  const { cutoffs, dataYear, dataRound } = getLatestCutoffs(records);

  const placement = getPlacementForCollege(instituteName);

  return {
    id,
    name: instituteName,
    shortName: matchedRecord.instituteShort,
    state: matchedRecord.state,
    instituteType: matchedRecord.instituteType,
    courseFee: matchedRecord.courseFee,
    cutoffs,
    placement,
    dataYear,
    dataRound,
    totalPrograms: cutoffs.length,
  };
}

export function getLatestCutoffs(records: JoSAARecord[]) {
  const latestYear = records.reduce((max, r) => (r.year > max ? r.year : max), 0);
  const inYear = records.filter((r) => r.year === latestYear);
  const latestRound = inYear.reduce((max, r) => (r.round > max ? r.round : max), 0);
  const cutoffs = inYear
    .filter((r) => r.round === latestRound)
    .sort((a, b) => a.closingRank - b.closingRank)
    .map((r) => ({
      program: r.program,
      degree: r.degree,
      quota: r.quota,
      seatType: r.seatType,
      gender: r.gender,
      openingRank: r.openingRank,
      closingRank: r.closingRank,
    }));

  return { cutoffs, dataYear: latestYear, dataRound: latestRound };
}
