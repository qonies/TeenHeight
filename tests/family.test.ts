import { describe, expect, it } from "vitest";
import { familyAdjustment, relationSex } from "../src/core/family";
import type { Profile } from "../src/core/types";

const withGrandparents = (): Profile => ({
  child: { sex: "male" },
  parents: { fatherCm: 175, motherCm: 160 },
  grandparents: {
    paternalGrandfatherCm: 172,
    paternalGrandmotherCm: 158,
    maternalGrandfatherCm: 170,
    maternalGrandmotherCm: 156,
  },
});

describe("家族亲属加权修正", () => {
  it("FAM-01 标准修正量", () => {
    const r = familyAdjustment(withGrandparents());
    expect(r.familyZ).toBeCloseTo(-0.598565, 5);
    expect(r.parentsZ).toBeCloseTo(-0.346884, 5);
    expect(r.adjustmentCm).toBeCloseTo(-0.918424, 4);
    expect(r.relativeCount).toBe(4);
  });

  it("FAM-02 无亲属不修正", () => {
    const r = familyAdjustment({
      child: { sex: "male" },
      parents: { fatherCm: 175, motherCm: 160 },
    });
    expect(r.adjustmentCm).toBe(0);
    expect(r.relativeCount).toBe(0);
  });

  it("FAM-03 上限截断 +4", () => {
    const r = familyAdjustment({
      child: { sex: "male" },
      parents: { fatherCm: 175, motherCm: 160 },
      grandparents: {
        paternalGrandfatherCm: 220,
        paternalGrandmotherCm: 220,
        maternalGrandfatherCm: 220,
        maternalGrandmotherCm: 220,
      },
      relatives: [
        { relation: "uncle_paternal", heightCm: 220 },
        { relation: "aunt_maternal", heightCm: 220 },
      ],
    });
    expect(r.adjustmentCm).toBe(4);
  });

  it("FAM-04 下限截断 -4", () => {
    const r = familyAdjustment({
      child: { sex: "male" },
      parents: { fatherCm: 175, motherCm: 160 },
      grandparents: {
        paternalGrandfatherCm: 120,
        paternalGrandmotherCm: 120,
        maternalGrandfatherCm: 120,
        maternalGrandmotherCm: 120,
      },
    });
    expect(r.adjustmentCm).toBe(-4);
  });

  it("FAM-05 关系映射性别", () => {
    expect(relationSex("uncle_paternal")).toBe("male");
    expect(relationSex("aunt_paternal")).toBe("female");
    expect(relationSex("aunt_maternal")).toBe("female");
    expect(relationSex("uncle_maternal")).toBe("male");
  });

  it("FAM-06 仅祖辈也触发修正", () => {
    const r = familyAdjustment(withGrandparents());
    expect(r.relativeCount).toBeGreaterThan(0);
    expect(r.adjustmentCm).not.toBe(0);
  });

  it("FAM-07 切换中国标准后修正量不同", () => {
    const r = familyAdjustment(withGrandparents(), "CHINA");
    expect(r.adjustmentCm).toBeCloseTo(-0.920106, 4);
    expect(r.adjustmentCm).not.toBeCloseTo(
      familyAdjustment(withGrandparents(), "WHO").adjustmentCm,
      3,
    );
  });
});
