import { describe, expect, it } from "vitest";
import { khamisRoche } from "../src/core/khamis-roche";

describe("Khamis-Roche 预测", () => {
  it("KR-01 男 10 岁", () => {
    const v = khamisRoche({
      sex: "male",
      ageMonths: 120,
      heightCm: 140,
      weightKg: 32,
      fatherCm: 175,
      motherCm: 160,
    });
    expect(v).not.toBeNull();
    expect(v as number).toBeCloseTo(177.7245, 3);
  });

  it("KR-02 女 10 岁", () => {
    const v = khamisRoche({
      sex: "female",
      ageMonths: 120,
      heightCm: 140,
      weightKg: 32,
      fatherCm: 175,
      motherCm: 160,
    });
    expect(v as number).toBeCloseTo(165.9723, 3);
  });

  it("KR-03 男 8 岁", () => {
    const v = khamisRoche({
      sex: "male",
      ageMonths: 96,
      heightCm: 128,
      weightKg: 26,
      fatherCm: 175,
      motherCm: 160,
    });
    expect(v as number).toBeCloseTo(176.3298, 3);
  });

  it("KR-04 女 12 岁", () => {
    const v = khamisRoche({
      sex: "female",
      ageMonths: 144,
      heightCm: 150,
      weightKg: 40,
      fatherCm: 175,
      motherCm: 160,
    });
    expect(v as number).toBeCloseTo(164.1646, 3);
  });

  it("KR-05 低于适用年龄返回 null", () => {
    expect(
      khamisRoche({
        sex: "male",
        ageMonths: 47,
        heightCm: 100,
        weightKg: 16,
        fatherCm: 175,
        motherCm: 160,
      }),
    ).toBeNull();
  });

  it("KR-06 高于适用年龄返回 null", () => {
    expect(
      khamisRoche({
        sex: "male",
        ageMonths: 211,
        heightCm: 175,
        weightKg: 60,
        fatherCm: 175,
        motherCm: 160,
      }),
    ).toBeNull();
  });

  it("KR-07 下边界 48 月适用", () => {
    expect(
      khamisRoche({
        sex: "male",
        ageMonths: 48,
        heightCm: 102,
        weightKg: 17,
        fatherCm: 175,
        motherCm: 160,
      }),
    ).not.toBeNull();
  });

  it("KR-08 上边界 210 月适用", () => {
    expect(
      khamisRoche({
        sex: "male",
        ageMonths: 210,
        heightCm: 175,
        weightKg: 62,
        fatherCm: 175,
        motherCm: 160,
      }),
    ).not.toBeNull();
  });

  it("KR-09 缺体重返回 null", () => {
    expect(
      khamisRoche({
        sex: "male",
        ageMonths: 120,
        heightCm: 140,
        fatherCm: 175,
        motherCm: 160,
      }),
    ).toBeNull();
  });
});
