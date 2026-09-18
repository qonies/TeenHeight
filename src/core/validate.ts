import {
  CHILD_AGE_MAX_MONTHS,
  CHILD_AGE_MIN_MONTHS,
  CHILD_HEIGHT_MAX_CM,
  CHILD_HEIGHT_MIN_CM,
  PARENT_HEIGHT_MAX_CM,
  PARENT_HEIGHT_MIN_CM,
  RELATIVE_HEIGHT_MAX_CM,
  RELATIVE_HEIGHT_MIN_CM,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
} from "./constants";
import type { Profile, ValidationIssue } from "./types";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** 面向用户的字段中文名（需求 §2：界面全中文表述）。 */
export const FIELD_LABELS: Record<string, string> = {
  fatherCm: "父亲身高",
  motherCm: "母亲身高",
  ageMonths: "月龄",
  heightCm: "孩子身高",
  weightKg: "体重",
  paternalGrandfatherCm: "祖父",
  paternalGrandmotherCm: "祖母",
  maternalGrandfatherCm: "外祖父",
  maternalGrandmotherCm: "外祖母",
};

/** 把字段 key 转为中文标签（含 relatives[i].heightCm 模式）。 */
export function fieldLabel(field: string): string {
  const direct = FIELD_LABELS[field];
  if (direct) return direct;
  const match = field.match(/^relatives\[(\d+)\]\.heightCm$/);
  if (match) return `旁系亲属第 ${Number(match[1]) + 1} 位身高`;
  return field;
}

function pushInvalid(issues: ValidationIssue[], field: string): void {
  issues.push({
    field,
    code: "invalid",
    message: `${fieldLabel(field)}需为有效数值，请确认`,
  });
}

/** 身高允许整数或 1 位小数（需求 4.1.1）。 */
function hasAtMostOneDecimal(value: number): boolean {
  return Math.abs(value * 10 - Math.round(value * 10)) < 1e-9;
}

function checkOptionalHeight(
  issues: ValidationIssue[],
  field: string,
  value: number | undefined,
  min: number,
  max: number,
): void {
  if (value === undefined) return;
  if (!isFiniteNumber(value)) {
    pushInvalid(issues, field);
    return;
  }
  if (value < min || value > max) {
    issues.push({
      field,
      code: "out_of_range",
      message: `${fieldLabel(field)}需在 ${min}–${max} cm 之间`,
    });
    return;
  }
  if (!hasAtMostOneDecimal(value)) {
    issues.push({
      field,
      code: "too_precise",
      message: `${fieldLabel(field)}最多支持 1 位小数`,
    });
  }
}

function checkRequiredHeight(
  issues: ValidationIssue[],
  field: string,
  value: number | undefined,
  min: number,
  max: number,
): void {
  if (value === undefined) {
    issues.push({ field, code: "required", message: `${fieldLabel(field)}为必填` });
    return;
  }
  if (!isFiniteNumber(value)) {
    pushInvalid(issues, field);
    return;
  }
  if (value < min || value > max) {
    issues.push({
      field,
      code: "out_of_range",
      message: `${fieldLabel(field)}需在 ${min}–${max} cm 之间`,
    });
    return;
  }
  if (!hasAtMostOneDecimal(value)) {
    issues.push({
      field,
      code: "too_precise",
      message: `${fieldLabel(field)}最多支持 1 位小数`,
    });
  }
}

export function validateProfile(profile: Profile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { parents, child } = profile;

  checkRequiredHeight(
    issues,
    "fatherCm",
    parents.fatherCm,
    PARENT_HEIGHT_MIN_CM,
    PARENT_HEIGHT_MAX_CM,
  );
  checkRequiredHeight(
    issues,
    "motherCm",
    parents.motherCm,
    PARENT_HEIGHT_MIN_CM,
    PARENT_HEIGHT_MAX_CM,
  );

  if (child.ageMonths !== undefined) {
    if (!Number.isInteger(child.ageMonths)) {
      issues.push({
        field: "ageMonths",
        code: "not_integer",
        message: "月龄必须为整数",
      });
    } else if (
      child.ageMonths < CHILD_AGE_MIN_MONTHS ||
      child.ageMonths > CHILD_AGE_MAX_MONTHS
    ) {
      issues.push({
        field: "ageMonths",
        code: "out_of_range",
        message: `月龄需在 ${CHILD_AGE_MIN_MONTHS}–${CHILD_AGE_MAX_MONTHS} 之间`,
      });
    }
  }

  if (child.heightCm !== undefined) {
    checkOptionalHeight(
      issues,
      "heightCm",
      child.heightCm,
      CHILD_HEIGHT_MIN_CM,
      CHILD_HEIGHT_MAX_CM,
    );
  }

  if (child.weightKg !== undefined) {
    if (!isFiniteNumber(child.weightKg)) {
      pushInvalid(issues, "weightKg");
    } else if (
      child.weightKg < WEIGHT_MIN_KG ||
      child.weightKg > WEIGHT_MAX_KG
    ) {
      issues.push({
        field: "weightKg",
        code: "out_of_range",
        message: `${fieldLabel("weightKg")}需在 ${WEIGHT_MIN_KG}–${WEIGHT_MAX_KG} kg 之间`,
      });
    }
  }

  if (
    (child.heightCm !== undefined || child.weightKg !== undefined) &&
    child.ageMonths === undefined
  ) {
    issues.push({
      field: "ageMonths",
      code: "missing_age",
      message: "填写孩子身高或体重时需同时提供月龄",
    });
  }

  const grandparents = profile.grandparents ?? {};
  checkOptionalHeight(
    issues,
    "paternalGrandfatherCm",
    grandparents.paternalGrandfatherCm,
    RELATIVE_HEIGHT_MIN_CM,
    RELATIVE_HEIGHT_MAX_CM,
  );
  checkOptionalHeight(
    issues,
    "paternalGrandmotherCm",
    grandparents.paternalGrandmotherCm,
    RELATIVE_HEIGHT_MIN_CM,
    RELATIVE_HEIGHT_MAX_CM,
  );
  checkOptionalHeight(
    issues,
    "maternalGrandfatherCm",
    grandparents.maternalGrandfatherCm,
    RELATIVE_HEIGHT_MIN_CM,
    RELATIVE_HEIGHT_MAX_CM,
  );
  checkOptionalHeight(
    issues,
    "maternalGrandmotherCm",
    grandparents.maternalGrandmotherCm,
    RELATIVE_HEIGHT_MIN_CM,
    RELATIVE_HEIGHT_MAX_CM,
  );

  (profile.relatives ?? []).forEach((relative, index) => {
    checkOptionalHeight(
      issues,
      `relatives[${index}].heightCm`,
      relative.heightCm,
      RELATIVE_HEIGHT_MIN_CM,
      RELATIVE_HEIGHT_MAX_CM,
    );
  });

  return issues;
}
