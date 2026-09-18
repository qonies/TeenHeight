import { describe, expect, it } from "vitest";
import { predict, ValidationError } from "../src/core/predict";
import type { Profile } from "../src/core/types";

const grandparents = {
  paternalGrandfatherCm: 172,
  paternalGrandmotherCm: 158,
  maternalGrandfatherCm: 170,
  maternalGrandmotherCm: 156,
};

const parentsOnly = (): Profile => ({
  child: { sex: "male" },
  parents: { fatherCm: 175, motherCm: 160 },
});

const krProfile = (): Profile => ({
  child: { sex: "male", ageMonths: 120, heightCm: 140, weightKg: 32 },
  parents: { fatherCm: 175, motherCm: 160 },
});

const cmhProfile = (): Profile => ({
  child: { sex: "male", ageMonths: 24, heightCm: 85 },
  parents: { fatherCm: 175, motherCm: 160 },
});

const familyKrProfile = (): Profile => ({ ...krProfile(), grandparents });
const familyMphProfile = (): Profile => ({ ...parentsOnly(), grandparents });

const isOneDecimal = (n: number): boolean =>
  Math.abs(n * 10 - Math.round(n * 10)) < 1e-9;

describe("predict 结果编排", () => {
  it("ORCH-01 仅父母 -> basic / MPH / 174.0", () => {
    const r = predict(parentsOnly());
    expect(r.tier).toBe("basic");
    expect(r.method).toBe("MPH");
    expect(r.baseMethod).toBe("MPH");
    expect(r.pointEstimateCm).toBe(174.0);
    expect(r.intervalCm.halfWidth).toBe(8.5);
    expect(r.intervalCm.low).toBe(165.5);
    expect(r.intervalCm.high).toBe(182.5);
  });

  it("ORCH-02 父母+孩子 -> advanced / KR / 177.7", () => {
    const r = predict(krProfile());
    expect(r.tier).toBe("advanced");
    expect(r.method).toBe("KR");
    expect(r.baseMethod).toBe("KR");
    expect(r.pointEstimateCm).toBe(177.7);
    expect(r.intervalCm.halfWidth).toBe(5);
  });

  it("ORCH-03 父母+孩子(无体重) -> advanced / CMH / 172.6", () => {
    const r = predict(cmhProfile());
    expect(r.tier).toBe("advanced");
    expect(r.method).toBe("CMH");
    expect(r.pointEstimateCm).toBe(172.6);
    expect(r.intervalCm.halfWidth).toBe(5);
  });

  it("ORCH-04 增强档（KR+亲属）", () => {
    const r = predict(familyKrProfile());
    expect(r.tier).toBe("enhanced");
    expect(r.method).toBe("family-adjusted");
    expect(r.baseMethod).toBe("KR");
    expect(r.familyAdjustmentCm).toBeCloseTo(-0.9, 1);
    expect(r.pointEstimateCm).toBe(176.8);
    expect(r.intervalCm.halfWidth).toBe(4);
  });

  it("ORCH-05 增强档（MPH+亲属）", () => {
    const r = predict(familyMphProfile());
    expect(r.tier).toBe("enhanced");
    expect(r.method).toBe("family-adjusted");
    expect(r.pointEstimateCm).toBe(173.1);
  });

  it("ORCH-06 区间对称", () => {
    const r = predict(parentsOnly());
    expect(r.intervalCm.low).toBeCloseTo(r.pointEstimateCm - r.intervalCm.halfWidth, 10);
    expect(r.intervalCm.high).toBeCloseTo(r.pointEstimateCm + r.intervalCm.halfWidth, 10);
  });

  it("ORCH-07 逐年预测首尾（有孩子当前信息）", () => {
    const r = predict(krProfile());
    expect(r.yearly[0]).toEqual({ ageMonths: 120, heightCm: 140 });
    const last = r.yearly[r.yearly.length - 1];
    expect(last.ageMonths).toBe(216);
    expect(last.heightCm).toBe(r.pointEstimateCm);
  });

  it("ORCH-08 逐年预测首尾（仅父母）", () => {
    const r = predict(parentsOnly());
    expect(r.yearly[0].ageMonths).toBe(0);
    const last = r.yearly[r.yearly.length - 1];
    expect(last.ageMonths).toBe(216);
    expect(last.heightCm).toBe(r.pointEstimateCm);
  });

  it("ORCH-09 百分位曲线 19 点且单调", () => {
    const r = predict(parentsOnly());
    expect(r.percentiles).toHaveLength(19);
    for (const point of r.percentiles) {
      expect(point.p3).toBeLessThan(point.p10);
      expect(point.p10).toBeLessThan(point.p50);
      expect(point.p50).toBeLessThan(point.p90);
      expect(point.p90).toBeLessThan(point.p97);
    }
  });

  it("ORCH-10 说明文案非空且含方法名", () => {
    const r = predict(krProfile());
    expect(r.explanation.length).toBeGreaterThan(0);
    expect(r.explanation.join(" ")).toContain("Khamis-Roche");
  });

  it("ORCH-11 非法输入抛 ValidationError", () => {
    expect(() => predict({ child: { sex: "male" }, parents: {} })).toThrow(
      ValidationError,
    );
  });

  it("ORCH-12 默认参照标准为 WHO", () => {
    const r = predict(parentsOnly());
    expect(r.reference).toBe("WHO");
    expect(r.referenceLabel).toBe("WHO 儿童生长标准");
  });

  it("ORCH-13 结果保留 1 位小数", () => {
    const r = predict(familyKrProfile());
    expect(isOneDecimal(r.pointEstimateCm)).toBe(true);
    expect(isOneDecimal(r.intervalCm.low)).toBe(true);
    expect(isOneDecimal(r.intervalCm.high)).toBe(true);
  });

  it("ORCH-14 可切换中国标准（仅父母，预测值不变）", () => {
    const r = predict(parentsOnly(), { standard: "CHINA" });
    expect(r.reference).toBe("CHINA");
    expect(r.referenceLabel).toBe("中国儿童生长标准");
    expect(r.tier).toBe("basic");
    expect(r.pointEstimateCm).toBe(174.0);
    expect(r.explanation.join(" ")).toContain("中国儿童生长标准");
  });

  it("ORCH-15 标准不影响点估（CMH 输入）", () => {
    const child: Profile = {
      child: { sex: "male", ageMonths: 24, heightCm: 88.5 },
      parents: { fatherCm: 175, motherCm: 160 },
    };
    expect(predict(child, { standard: "CHINA" }).pointEstimateCm).toBe(174.9);
    expect(predict(child, { standard: "WHO" }).pointEstimateCm).toBe(174.9);
  });

  it("ORCH-16 中国标准的增强档与曲线", () => {
    const r = predict(familyKrProfile(), { standard: "CHINA" });
    expect(r.reference).toBe("CHINA");
    expect(r.tier).toBe("enhanced");
    expect(r.pointEstimateCm).toBe(176.8);
    expect(r.percentiles).toHaveLength(19);
    expect(r.yearly[r.yearly.length - 1].ageMonths).toBe(216);
  });

  it("ORCH-17 预测值不随标准切换改变", () => {
    expect(
      predict(familyKrProfile(), { standard: "CHINA" }).pointEstimateCm,
    ).toBe(predict(familyKrProfile(), { standard: "WHO" }).pointEstimateCm);
  });

  it("ORCH-18 标准切换改变 SDS 与百分位但不改变预测值", () => {
    const who = predict(cmhProfile());
    const chn = predict(cmhProfile(), { standard: "CHINA" });
    expect(chn.pointEstimateCm).toBe(who.pointEstimateCm);
    expect(chn.childSds).not.toBeCloseTo(who.childSds as number, 3);
  });

  it("ORCH-19 重复亲属关系提示按均值计算", () => {
    const r = predict({
      child: { sex: "male" },
      parents: { fatherCm: 175, motherCm: 160 },
      relatives: [
        { relation: "uncle_paternal", heightCm: 170 },
        { relation: "uncle_paternal", heightCm: 180 },
      ],
    });
    expect(r.tier).toBe("enhanced");
    expect(r.explanation.join(" ")).toContain("重复的亲属关系");
    expect(r.explanation.join(" ")).toContain("已按均值参与计算");
  });
});
