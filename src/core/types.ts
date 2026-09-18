export type Sex = "male" | "female";

export type ReferenceStandard = "WHO" | "CHINA";

export type RelativeRelation =
  | "uncle_paternal"
  | "aunt_paternal"
  | "aunt_maternal"
  | "uncle_maternal";

export interface ChildInput {
  sex: Sex;
  ageMonths?: number;
  heightCm?: number;
  weightKg?: number;
}

export interface ParentsInput {
  fatherCm?: number;
  motherCm?: number;
}

export interface GrandparentsInput {
  paternalGrandfatherCm?: number;
  paternalGrandmotherCm?: number;
  maternalGrandfatherCm?: number;
  maternalGrandmotherCm?: number;
}

export interface Relative {
  relation: RelativeRelation;
  heightCm: number;
}

export interface Profile {
  child: ChildInput;
  parents: ParentsInput;
  grandparents?: GrandparentsInput;
  relatives?: Relative[];
  note?: string;
}

export type Tier = "basic" | "advanced" | "enhanced";
export type BaseMethod = "MPH" | "CMH" | "KR";
export type Method = BaseMethod | "family-adjusted";

export type ValidationCode =
  | "required"
  | "invalid"
  | "out_of_range"
  | "too_precise"
  | "not_integer"
  | "missing_age";

export interface ValidationIssue {
  field: string;
  code: ValidationCode;
  message: string;
}

export interface PercentilePoint {
  ageMonths: number;
  p3: number;
  p10: number;
  p50: number;
  p90: number;
  p97: number;
}

export interface YearlyPoint {
  ageMonths: number;
  heightCm: number;
}

export interface PredictionResult {
  pointEstimateCm: number;
  intervalCm: { low: number; high: number; halfWidth: number };
  tier: Tier;
  method: Method;
  baseMethod: BaseMethod;
  reference: ReferenceStandard;
  referenceLabel: string;
  childSds?: number;
  familyAdjustmentCm: number;
  percentiles: PercentilePoint[];
  yearly: YearlyPoint[];
  explanation: string[];
}
