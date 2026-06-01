import { Branch, College } from "@/app/data";

export interface BranchWithProb extends Branch {
  prob: "high" | "medium" | "low";
}

export interface CollegeWithFilteredBranches extends Omit<College, "branches"> {
  branches: BranchWithProb[];
}

export interface PredictorFormValues {
  name: string;
  email: string;
  exam: "JEE Advanced" | "JEE Main";
  rank: string;
  category: string;
  domicileState: string;
  gender: string;
}

export interface FilterState {
  searchQuery: string;
  activeProbFilter: "high" | "medium" | "low" | null;
  durationFilters: string[];
  degreeFilters: string[];
  branchSearch: string;
  stateSearch: string;
  quickFilter: string;
}
