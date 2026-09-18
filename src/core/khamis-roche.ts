import { KHAMIS_ROCHE_COEFFICIENTS } from "../data/khamis-roche";
import { KR_MIN_MONTHS, KR_MAX_MONTHS } from "./constants";
import type { Sex } from "./types";

const CM_PER_INCH = 2.54;
const CM_TO_INCH = 1 / CM_PER_INCH;
const KG_TO_LB = 2.2046226218487757;

export interface KhamisRocheInput {
  sex: Sex;
  ageMonths: number;
  heightCm: number;
  weightKg?: number;
  fatherCm: number;
  motherCm: number;
}

/**
 * Khamis-Roche 成年身高预测（cm）。
 * 仅在月龄 ∈ [48, 210] 且身高、体重、父母身高齐全时可用，否则返回 null。
 */
export function khamisRoche(input: KhamisRocheInput): number | null {
  const { sex, ageMonths, heightCm, weightKg, fatherCm, motherCm } = input;
  if (
    !Number.isFinite(ageMonths) ||
    ageMonths < KR_MIN_MONTHS ||
    ageMonths > KR_MAX_MONTHS
  ) {
    return null;
  }
  if (typeof weightKg !== "number" || !Number.isFinite(weightKg)) {
    return null;
  }
  if (
    !Number.isFinite(heightCm) ||
    !Number.isFinite(fatherCm) ||
    !Number.isFinite(motherCm)
  ) {
    return null;
  }
  const row = KHAMIS_ROCHE_COEFFICIENTS[sex].find(
    (r) => ageMonths <= r.maxAgeMonths,
  );
  if (!row) return null;

  const childIn = heightCm * CM_TO_INCH;
  const weightLb = weightKg * KG_TO_LB;
  const parentAvgIn = ((fatherCm + motherCm) / 2) * CM_TO_INCH;
  const adultIn = row.b0 + row.b1 * childIn + row.b2 * weightLb + row.b3 * parentAvgIn;
  return adultIn * CM_PER_INCH;
}
