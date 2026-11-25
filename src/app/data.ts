// JoSAA Record - flat structure matching josaa_data.json
export interface JoSAARecord {
  institute: string;
  instituteShort: string;
  instituteType: 'IIT' | 'NIT' | 'IIIT' | 'GFTI' | 'SPA';
  state: string;
  program: string;
  degree: string;
  quota: 'AI' | 'HS' | 'OS';
  seatType: 'OPEN' | 'OBC-NCL' | 'SC' | 'ST' | 'EWS' | 'OPEN (PwD)' | 'OBC-NCL (PwD)' | 'SC (PwD)' | 'ST (PwD)' | 'EWS (PwD)';
  gender: 'Gender-Neutral' | 'Female-only';
  openingRank: number;
  closingRank: number;
  year: number;
  round: number;
  courseFee: string;
}

// College metadata derived from josaa_data.json for UI display
export interface CollegeMetadata {
  id: string;
  name: string;
  shortName: string;
  instituteType: string;
  state: string;
  courseFee: string;
  logo: string;
  highestPackage?: string;
}

// Branch for prediction results
export interface Branch {
  name: string;
  degree: string;
  package: string | null;
  opening: number;
  closing: number;
  isCS: boolean;
  isCore: boolean;
  quota: string;
  seatType: string;
  gender: string;
}

// College for prediction results
export interface College {
  id: string;
  name: string;
  logo: string;
  state: string;
  courseFee: string;
  annualFee?: string;
  medianPackage?: string;
  avgPackage?: string;
  highestPackage?: string;
  placementRate?: string;
  totalOffers?: number;
  placementYear?: number;
  top5: boolean;
  top10: boolean;
  instituteType: string;
  branches: Branch[];
}

// Mapping category names from form to JoSAA seat types
export const CATEGORY_TO_SEAT_TYPE: Record<string, string[]> = {
  'General (CRL)': ['OPEN'],
  'OBC-NCL': ['OBC-NCL'],
  'SC': ['SC'],
  'ST': ['ST'],
  'EWS': ['EWS'],
  'PwD': ['OPEN (PwD)', 'OBC-NCL (PwD)', 'SC (PwD)', 'ST (PwD)', 'EWS (PwD)'],
};

// Top 5 and Top 10 IITs
export const TOP_5_IITS = new Set([
  'Indian Institute of Technology Bombay',
  'Indian Institute of Technology Delhi',
  'Indian Institute of Technology Madras',
  'Indian Institute of Technology Kanpur',
  'Indian Institute of Technology Kharagpur',
]);

export const TOP_10_IITS = new Set([
  ...TOP_5_IITS,
  'Indian Institute of Technology Roorkee',
  'Indian Institute of Technology Guwahati',
  'Indian Institute of Technology Hyderabad',
  'Indian Institute of Technology BHU Varanasi',
  'Indian Institute of Technology Indore',
]);


// Average package estimates by institute type (for display)
export const PACKAGE_ESTIMATES: Record<string, string> = {
  'IIT Bombay': '25 LPA',
  'IIT Delhi': '24 LPA',
  'IIT Madras': '22 LPA',
  'IIT Kanpur': '21 LPA',
  'IIT Kharagpur': '20 LPA',
  'IIT Roorkee': '18 LPA',
  'IIT Guwahati': '16 LPA',
  'IIT Hyderabad': '17 LPA',
  'IIT BHU': '15 LPA',
  'IIT Indore': '14 LPA',
};

// Generate a stable ID from institute name
export function getInstituteId(instituteName: string): string {
  return instituteName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Determine if a program is CS-related
export function isProgramCS(programName: string): boolean {
  const csKeywords = ['computer science', 'information technology', 'artificial intelligence', 
    'machine learning', 'data science', 'software', 'computing'];
  return csKeywords.some(kw => programName.toLowerCase().includes(kw));
}

// Determine if a program is a core engineering program
export function isProgramCore(programName: string, _degree: string): boolean {
  if (isProgramCS(programName)) return false;
  const coreKeywords = ['electrical', 'mechanical', 'civil', 'chemical', 'aerospace', 
    'metallurgical', 'mining', 'naval', 'production', 'manufacturing', 'electronics'];
  return coreKeywords.some(kw => programName.toLowerCase().includes(kw));
}
