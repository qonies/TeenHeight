import {
  ADVANCED_HALF_WIDTH,
  BASIC_HALF_WIDTH,
  ENHANCED_HALF_WIDTH,
  PREDICTION_AGE_MONTHS,
  Z_P10,
  Z_P3,
  Z_P50,
  Z_P90,
  Z_P97,
} from "./constants";
import { conditionalTargetHeight } from "./cmh";
import { familyAdjustment, RELATION_LABELS } from "./family";
import {
  ANCHOR_STANDARD,
  heightPercentile,
  heightSds,
  REFERENCE_DESCRIPTIONS,
  REFERENCE_LABELS,
  valueAtZ,
} from "./growth";
import { khamisRoche } from "./khamis-roche";
import { midParentalHeight } from "./mph";
import { validateProfile, fieldLabel } from "./validate";
import type {
  BaseMethod,
  Method,
  PercentilePoint,
  PredictionResult,
  Profile,
  ReferenceStandard,
  Tier,
  ValidationIssue,
  YearlyPoint,
} from "./types";

export interface PredictOptions {
  standard?: ReferenceStandard;
}

export class ValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(`输入校验失败：${issues.map((i) => fieldLabel(i.field)).join("、")}`);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

const METHOD_LABEL: Record<Method, string> = {
  MPH: "父母平均身高法（MPH）",
  CMH: "校正父母平均身高（CMH 近似）",
  KR: "Khamis-Roche 法",
  "family-adjusted": "基础方法 + 家族亲属加权修正",
};

const TIER_LABEL: Record<Tier, string> = {
  basic: "基础精度（仅父母）",
  advanced: "进阶精度（含孩子当前信息）",
  enhanced: "增强精度（含家族亲属数据）",
};

export function predict(
  profile: Profile,
  options: PredictOptions = {},
): PredictionResult {
  const issues = validateProfile(profile);
  if (issues.length > 0) {
    throw new ValidationError(issues);
  }

  const standard = options.standard ?? "WHO";
  const anchor = ANCHOR_STANDARD;
  const sex = profile.child.sex;
  const fatherCm = profile.parents.fatherCm as number;
  const motherCm = profile.parents.motherCm as number;
  const mph = midParentalHeight(fatherCm, motherCm, sex);

  const { ageMonths, heightCm, weightKg } = profile.child;

  let baseMethod: BaseMethod = "MPH";
  let baseValue = mph;
  let childSds: number | undefined;

  if (ageMonths !== undefined && heightCm !== undefined) {
    const childSdsAnchor = heightSds(anchor, sex, ageMonths, heightCm);
    childSds = heightSds(standard, sex, ageMonths, heightCm);
    const kr =
      weightKg !== undefined
        ? khamisRoche({
            sex,
            ageMonths,
            heightCm,
            weightKg,
            fatherCm,
            motherCm,
          })
        : null;
    if (kr !== null) {
      baseMethod = "KR";
      baseValue = kr;
    } else {
      baseMethod = "CMH";
      baseValue = conditionalTargetHeight(mph, childSdsAnchor);
    }
  }

  const family = familyAdjustment(profile, anchor);
  const hasRelatives = family.relativeCount > 0;
  // 预测的成年身高为绝对值（cm），不随参照标准切换而映射；
  // 所选标准仅影响孩子当前 SDS、百分位与生长曲线。
  const rawPoint = baseValue + (hasRelatives ? family.adjustmentCm : 0);

  // 同一关系多条记录时，各自等权参与加权平均（等价于取均值），需向用户提示。
  const relationCounts = new Map<string, number>();
  for (const relative of profile.relatives ?? []) {
    relationCounts.set(
      relative.relation,
      (relationCounts.get(relative.relation) ?? 0) + 1,
    );
  }
  const duplicatedRelations = [...relationCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([relation]) => relation);

  const tier: Tier = hasRelatives
    ? "enhanced"
    : baseMethod === "MPH"
      ? "basic"
      : "advanced";
  const method: Method = hasRelatives ? "family-adjusted" : baseMethod;
  const halfWidth =
    tier === "basic"
      ? BASIC_HALF_WIDTH
      : tier === "advanced"
        ? ADVANCED_HALF_WIDTH
        : ENHANCED_HALF_WIDTH;

  const pointEstimateCm = round1(rawPoint);
  const intervalCm = {
    low: round1(pointEstimateCm - halfWidth),
    high: round1(pointEstimateCm + halfWidth),
    halfWidth,
  };

  const startMonth = ageMonths ?? 0;
  const zAdult = heightSds(standard, sex, PREDICTION_AGE_MONTHS, rawPoint);
  const zStart = childSds ?? zAdult;

  const yearly: YearlyPoint[] = [];
  if (startMonth >= PREDICTION_AGE_MONTHS) {
    yearly.push({ ageMonths: PREDICTION_AGE_MONTHS, heightCm: pointEstimateCm });
  } else {
    for (let month = startMonth; month <= PREDICTION_AGE_MONTHS; month += 12) {
      const t = (month - startMonth) / (PREDICTION_AGE_MONTHS - startMonth);
      const z = zStart + (zAdult - zStart) * t;
      yearly.push({ ageMonths: month, heightCm: round1(valueAtZ(standard, sex, month, z)) });
    }
    const last = yearly[yearly.length - 1];
    if (last.ageMonths !== PREDICTION_AGE_MONTHS) {
      yearly.push({ ageMonths: PREDICTION_AGE_MONTHS, heightCm: pointEstimateCm });
    } else {
      last.heightCm = pointEstimateCm;
    }
  }

  const percentiles: PercentilePoint[] = [];
  for (let month = 0; month <= PREDICTION_AGE_MONTHS; month += 12) {
    percentiles.push({
      ageMonths: month,
      p3: round1(valueAtZ(standard, sex, month, Z_P3)),
      p10: round1(valueAtZ(standard, sex, month, Z_P10)),
      p50: round1(valueAtZ(standard, sex, month, Z_P50)),
      p90: round1(valueAtZ(standard, sex, month, Z_P90)),
      p97: round1(valueAtZ(standard, sex, month, Z_P97)),
    });
  }

  const explanation: string[] = [];
  explanation.push(`基础方法：${METHOD_LABEL[baseMethod]}。`);
  explanation.push(`精度档位：${TIER_LABEL[tier]}。`);
  if (childSds !== undefined && ageMonths !== undefined) {
    const pct = heightPercentile(standard, sex, ageMonths, heightCm as number);
    explanation.push(
      `孩子当前身高约位于 ${REFERENCE_LABELS[standard]} 参照人群第 ${pct.toFixed(1)} 百分位（SDS ${childSds.toFixed(2)}）。`,
    );
  }
  if (hasRelatives) {
    explanation.push(
      `已纳入 ${family.relativeCount} 位亲属身高，亲属修正量 ${family.adjustmentCm.toFixed(1)} cm（实验性，幅度上限 ±4 cm）。`,
    );
  }
  if (duplicatedRelations.length > 0) {
    explanation.push(
      `存在重复的亲属关系（${duplicatedRelations
        .map((relation) => RELATION_LABELS[relation as keyof typeof RELATION_LABELS] ?? relation)
        .join("、")}），已按均值参与计算。`,
    );
  }
  explanation.push(
    `参照标准：${REFERENCE_LABELS[standard]}（${REFERENCE_DESCRIPTIONS[standard]}）。`,
  );
  explanation.push(
    `预测的成年身高为绝对值（cm），不随参照标准切换而改变；${REFERENCE_LABELS[standard]}用于计算孩子当前 SDS、百分位与生长曲线。`,
  );
  explanation.push(`结果仅供参考，不构成医学建议。`);

  return {
    pointEstimateCm,
    intervalCm,
    tier,
    method,
    baseMethod,
    reference: standard,
    referenceLabel: REFERENCE_LABELS[standard],
    childSds,
    familyAdjustmentCm: round1(hasRelatives ? family.adjustmentCm : 0),
    percentiles,
    yearly,
    explanation,
  };
}
