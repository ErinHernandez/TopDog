/**
 * Location Research Types
 *
 * Type definitions for fantasy sports compliance research by location.
 *
 * @module lib/location-research/types
 */

export interface FantasySportsFormat {
  legal: boolean;
  classification: string;
  requiresLicensing: boolean;
  requiresRegistration: boolean;
  restrictions: string[];
  notes: string;
}

export interface FantasySports {
  seasonLong?: FantasySportsFormat;
  dailyFantasy?: FantasySportsFormat;
  bestBall?: FantasySportsFormat;
  otherFormats?: FantasySportsFormat;
}

export interface GeneralGambling {
  legal: boolean;
  onlineGambling: boolean;
  sportsBetting: boolean;
  onlineSportsBetting: boolean;
  restrictions: string[];
  notes: string;
}

export interface RegulatoryFramework {
  primaryRegulator: string;
  regulatoryLevel: string;
  enforcementLevel: string;
  complianceRequirements: string[];
  licensingFees: number;
  annualFees: number;
  reportingRequirements: string[];
  notes: string;
}

export interface Taxation {
  requiresTaxInfo: boolean;
  taxRate: number;
  withholdingRequirements: boolean;
  reportingFrequency: string;
  notes: string;
}

export interface Documentation {
  requiresDocumentation: boolean;
  requiredDocuments: string[];
  verificationProcess: string;
  renewalFrequency: string;
  notes: string;
}

export interface OfficialDocument {
  id?: string;
  title?: string;
  billNumber?: string;
  year?: string;
  status?: string;
  jurisdiction?: string;
  sponsor?: string;
  summary?: string;
  fullText?: string;
  fantasySportsImpact?: string;
  effectiveDate?: string;
  notes?: string;
  date?: string;
  codeSection?: string;
  enforcementAgency?: string;
  penalties?: string;
  fantasySportsRelevance?: string;
  committee?: string;
  dateIntroduced?: string;
  courtStatus?: string;
  court?: string;
  caseNumber?: string;
}

export interface CourtDecision {
  id: string;
  title: string;
  date: string;
  court: string;
  caseNumber: string;
  summary: string;
  fantasySportsImpact: string;
  status: string;
}

export interface OfficialDocuments {
  bills?: OfficialDocument[];
  codes?: OfficialDocument[];
  regulations?: string[];
  courtDecisions?: CourtDecision[] | OfficialDocument[] | string[];
  administrativeDecisions?: string[];
  governmentPublications?: string[];
  licensingRequirements?: OfficialDocument[];
  taxDocuments?: string[];
  faqs?: OfficialDocument[];
  opinions?: OfficialDocument[];
  compacts?: OfficialDocument[];
}

export interface RecentChange {
  date: string;
  description: string;
  impact: string;
}

export interface PendingLegislation {
  id?: string;
  title?: string;
  billNumber?: string;
  session?: string;
  status?: string;
  description?: string;
  bill?: string;
  committee?: string;
  notes?: string;
}

export interface CourtCase {
  case: string;
  date: string;
  outcome: string;
  impact: string;
}

export interface LegalFramework {
  primaryLaws: string[];
  recentChanges: (string | RecentChange)[];
  pendingLegislation: (string | PendingLegislation)[];
  courtCases: (string | CourtCase)[];
  legalPrecedents: string[];
  notes: string;
  officialDocuments?: OfficialDocuments;
}

export interface Compliance {
  gambling: {
    generalGambling: GeneralGambling;
    fantasySports?: FantasySports;
    regulatoryFramework?: RegulatoryFramework;
    taxation?: Taxation;
    documentation?: Documentation;
  };
  legalFramework?: LegalFramework;
}

export interface SportsPopularity {
  popularity: number;
  viewership: number;
  participation: number;
  fantasyParticipation: number;
}

export interface SportsData {
  popularity: {
    americanFootball: SportsPopularity;
    basketball: SportsPopularity;
    baseball: SportsPopularity;
    soccer: SportsPopularity;
    hockey: SportsPopularity;
  };
  leagues: Record<string, unknown>;
  fantasySports?: Record<string, unknown>;
  gambling?: Record<string, unknown>;
}

export interface LocationData {
  id: string;
  name: string;
  country: string;
  state: string;
  type: string;
  status: 'research' | 'approved' | 'denied' | 'pending';
  notes: string;
  compliance?: Compliance;
  sports?: SportsData;
  demographics?: Record<string, unknown>;
  economy?: Record<string, unknown>;
  technology?: Record<string, unknown>;
  business?: Record<string, unknown>;
  political?: Record<string, unknown>;
}

export type SortBy = 'name' | 'state' | 'status';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid';
