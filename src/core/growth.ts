import {
  WHO_HEIGHT_LMS,
  WHO_AGE_MIN_MONTHS,
  WHO_AGE_MAX_MONTHS,
} from "../data/who-height-lms";
import {
  CHINA_HEIGHT_LMS,
  CHINA_AGE_MIN_MONTHS,
  CHINA_AGE_MAX_MONTHS,
} from "../data/china-height-lms";
import type { ReferenceStandard, Sex } from "./types";
import { lmsToZScore, zScoreToValue, zScoreToPercentile } from "./lms";

export type { ReferenceStandard };

export interface LmsParams {
  l: number;
  m: number;
  s: number;
}

type Tuple = readonly [number, number, number, number];

interface ReferenceTable {
  knots: readonly Tuple[];
  min: number;
  max: number;
}

const TABLES: Record<ReferenceStandard, Record<Sex, ReferenceTable>> = {
  WHO: {
    male: { knots: WHO_HEIGHT_LMS.male, min: WHO_AGE_MIN_MONTHS, max: WHO_AGE_MAX_MONTHS },
    female: { knots: WHO_HEIGHT_LMS.female, min: WHO_AGE_MIN_MONTHS, max: WHO_AGE_MAX_MONTHS },
  },
  CHINA: {
    male: { knots: CHINA_HEIGHT_LMS.male, min: CHINA_AGE_MIN_MONTHS, max: CHINA_AGE_MAX_MONTHS },
    female: { knots: CHINA_HEIGHT_LMS.female, min: CHINA_AGE_MIN_MONTHS, max: CHINA_AGE_MAX_MONTHS },
  },
};

export const REFERENCE_LABELS: Record<ReferenceStandard, string> = {
  WHO: "WHO 儿童生长标准",
  CHINA: "中国儿童生长标准",
};

export const REFERENCE_DESCRIPTIONS: Record<ReferenceStandard, string> = {
  WHO: "WHO Child Growth Standards（0–5 岁）与 WHO 2007 参考（5–19 岁）",
  CHINA: "中国城市儿童生长参考（Zong & Li 2013，0–18 岁）",
};

export function referenceRange(standard: ReferenceStandard): { min: number; max: number } {
  const table = TABLES[standard].male;
  return { min: table.min, max: table.max };
}

function findBracketing(knots: readonly Tuple[], month: number): [Tuple, Tuple] {
  const first = knots[0];
  const last = knots[knots.length - 1];
  if (month <= first[0]) return [first, first];
  if (month >= last[0]) return [last, last];
  let lo = 0;
  let hi = knots.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (knots[mid][0] <= month) lo = mid;
    else hi = mid;
  }
  return [knots[lo], knots[hi]];
}

/**
 * 查表得到某标准的 L/M/S。WHO 为逐月节点；中国标准为离散节点，
 * 非节点月龄对 L/M/S 做线性插值。
 */
export function lookupLms(
  standard: ReferenceStandard,
  sex: Sex,
  ageMonths: number,
): LmsParams {
  const table = TABLES[standard][sex];
  if (
    !Number.isInteger(ageMonths) ||
    ageMonths < table.min ||
    ageMonths > table.max
  ) {
    throw new RangeError(
      `${REFERENCE_LABELS[standard]} 月龄 ${ageMonths} 超出范围 [${table.min}, ${table.max}]`,
    );
  }
  const [a, b] = findBracketing(table.knots, ageMonths);
  if (a[0] === b[0]) return { l: a[1], m: a[2], s: a[3] };
  const t = (ageMonths - a[0]) / (b[0] - a[0]);
  return {
    l: a[1] + (b[1] - a[1]) * t,
    m: a[2] + (b[2] - a[2]) * t,
    s: a[3] + (b[3] - a[3]) * t,
  };
}

/** 给定标准、性别、月龄、身高，返回相对参照人群的 SDS。 */
export function heightSds(
  standard: ReferenceStandard,
  sex: Sex,
  ageMonths: number,
  heightCm: number,
): number {
  const { l, m, s } = lookupLms(standard, sex, ageMonths);
  return lmsToZScore(heightCm, l, m, s);
}

/** 给定标准、性别、月龄、z 值，返回对应身高（cm）。 */
export function valueAtZ(
  standard: ReferenceStandard,
  sex: Sex,
  ageMonths: number,
  z: number,
): number {
  const { l, m, s } = lookupLms(standard, sex, ageMonths);
  return zScoreToValue(z, l, m, s);
}

/** 给定标准、性别、月龄、身高，返回百分位（0..100）。 */
export function heightPercentile(
  standard: ReferenceStandard,
  sex: Sex,
  ageMonths: number,
  heightCm: number,
): number {
  return zScoreToPercentile(heightSds(standard, sex, ageMonths, heightCm)) * 100;
}

/** 成人参照：取该标准月龄上限处的 M、S。 */
export function adultReference(standard: ReferenceStandard, sex: Sex): LmsParams {
  return lookupLms(standard, sex, TABLES[standard][sex].max);
}

/** 成人身高的近似标准差 SD = M × S。 */
export function adultSd(standard: ReferenceStandard, sex: Sex): number {
  const ref = adultReference(standard, sex);
  return ref.m * ref.s;
}

/**
 * 预测模型的锚点参照。MPH / Khamis-Roche / CMH 与亲属修正均在 WHO 参照
 * 框架内计算；预测的成年身高为绝对值（cm），不随所选标准做映射。
 */
export const ANCHOR_STANDARD: ReferenceStandard = "WHO";
