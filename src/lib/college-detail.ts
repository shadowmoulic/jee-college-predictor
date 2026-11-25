import { getJosaaData } from "@/lib/josaa-data";
import { getInstituteId } from "@/app/data";
import { getPlacementForCollege } from "@/lib/placement-data";

export function getCollegeDetail(id: string) {
  const all = getJosaaData();

  const matchedRecord = all.find((r) => getInstituteId(r.institute) === id);
  if (!matchedRecord) {
    return null;
  }

  const instituteName = matchedRecord.institute;
  const records = all.filter((r) => r.institute === instituteName);

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

export function getLatestCutoffs(records: ReturnType<typeof getJosaaData>) {
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
