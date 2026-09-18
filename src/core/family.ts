import {
  FAMILY_GAIN,
  FAMILY_MAX_CM,
  PARENT_WEIGHT,
  RELATIVE_WEIGHT,
} from "./constants";
import { adultReference, adultSd } from "./growth";
import type { Profile, ReferenceStandard, RelativeRelation, Sex } from "./types";

export function relationSex(relation: RelativeRelation): Sex {
  return relation === "uncle_paternal" || relation === "uncle_maternal"
    ? "male"
    : "female";
}

export const RELATION_LABELS: Record<RelativeRelation, string> = {
  uncle_paternal: "叔伯",
  aunt_paternal: "姑",
  aunt_maternal: "姨",
  uncle_maternal: "舅",
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function standardize(
  heightCm: number,
  sex: Sex,
  standard: ReferenceStandard,
): number {
  const ref = adultReference(standard, sex);
  return (heightCm - ref.m) / (ref.m * ref.s);
}

export interface FamilyComponents {
  familyZ: number;
  parentsZ: number;
  adjustmentCm: number;
  relativeCount: number;
}

/**
 * 家族亲属数据加权修正（实验性）。
 * 以亲缘系数为权重，标准化后与“仅父母”的均值比较，得到有上限的修正量。
 */
export function familyAdjustment(
  profile: Profile,
  standard: ReferenceStandard = "WHO",
): FamilyComponents {
  const { fatherCm, motherCm } = profile.parents;
  if (!isFiniteNumber(fatherCm) || !isFiniteNumber(motherCm)) {
    return { familyZ: 0, parentsZ: 0, adjustmentCm: 0, relativeCount: 0 };
  }

  const zFather = standardize(fatherCm, "male", standard);
  const zMother = standardize(motherCm, "female", standard);

  let sum = PARENT_WEIGHT * zFather + PARENT_WEIGHT * zMother;
  let weightSum = PARENT_WEIGHT * 2;
  let relativeCount = 0;

  const grandparents = profile.grandparents ?? {};
  const grandparentEntries: Array<[number | undefined, Sex]> = [
    [grandparents.paternalGrandfatherCm, "male"],
    [grandparents.paternalGrandmotherCm, "female"],
    [grandparents.maternalGrandfatherCm, "male"],
    [grandparents.maternalGrandmotherCm, "female"],
  ];
  for (const [height, sex] of grandparentEntries) {
    if (isFiniteNumber(height)) {
      sum += RELATIVE_WEIGHT * standardize(height, sex, standard);
      weightSum += RELATIVE_WEIGHT;
      relativeCount += 1;
    }
  }

  for (const relative of profile.relatives ?? []) {
    if (isFiniteNumber(relative.heightCm)) {
      sum +=
        RELATIVE_WEIGHT *
        standardize(relative.heightCm, relationSex(relative.relation), standard);
      weightSum += RELATIVE_WEIGHT;
      relativeCount += 1;
    }
  }

  const familyZ = sum / weightSum;
  const parentsZ = (zFather + zMother) / 2;
  const raw =
    FAMILY_GAIN * (familyZ - parentsZ) * adultSd(standard, profile.child.sex);
  const adjustmentCm = Math.max(-FAMILY_MAX_CM, Math.min(FAMILY_MAX_CM, raw));

  return { familyZ, parentsZ, adjustmentCm, relativeCount };
}
