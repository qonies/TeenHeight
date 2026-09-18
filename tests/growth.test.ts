import { describe, expect, it } from "vitest";
import {
  adultReference,
  adultSd,
  heightPercentile,
  heightSds,
  lookupLms,
  referenceRange,
  valueAtZ,
} from "../src/core/growth";

describe("生长参照：WHO", () => {
  it("WHO-01 男 0 月 M=49.8842", () => {
    expect(lookupLms("WHO", "male", 0).m).toBeCloseTo(49.8842, 4);
  });

  it("WHO-02 男 60 月 M=109.7265", () => {
    expect(lookupLms("WHO", "male", 60).m).toBeCloseTo(109.7265, 4);
  });

  it("WHO-03 女 24 月 M=85.7299", () => {
    expect(lookupLms("WHO", "female", 24).m).toBeCloseTo(85.7299, 4);
  });

  it("WHO-04 中位数 SDS=0", () => {
    expect(heightSds("WHO", "male", 24, 87.1303)).toBeCloseTo(0, 6);
  });

  it("WHO-05 偏低 SDS", () => {
    expect(heightSds("WHO", "male", 24, 85)).toBeCloseTo(-0.696967, 5);
  });

  it("WHO-06 反查 z=2", () => {
    expect(valueAtZ("WHO", "male", 24, 2)).toBeCloseTo(93.243362, 5);
  });

  it("WHO-07 反查 z=-2", () => {
    expect(valueAtZ("WHO", "male", 24, -2)).toBeCloseTo(81.017238, 5);
  });

  it("WHO-08 反查 z=0 等于 M", () => {
    expect(valueAtZ("WHO", "male", 24, 0)).toBeCloseTo(87.1303, 6);
  });

  it("WHO-09 月龄越界抛 RangeError", () => {
    expect(() => lookupLms("WHO", "male", 229)).toThrow(RangeError);
  });

  it("WHO-10 18 岁（216 月）可用", () => {
    expect(lookupLms("WHO", "male", 216).m).toBeGreaterThan(0);
  });

  it("WHO-11 女 228 月 M=163.1548", () => {
    expect(lookupLms("WHO", "female", 228).m).toBeCloseTo(163.1548, 4);
  });

  it("WHO-12 百分位换算", () => {
    expect(heightPercentile("WHO", "male", 24, 85)).toBeCloseTo(24.29, 1);
  });

  it("WHO-13 成人参照与 SD", () => {
    expect(adultReference("WHO", "male").m).toBeCloseTo(176.5432, 4);
    expect(adultReference("WHO", "female").m).toBeCloseTo(163.1548, 4);
    expect(adultSd("WHO", "male")).toBeCloseTo(7.298296, 5);
    expect(adultSd("WHO", "female")).toBeCloseTo(6.540876, 5);
  });
});

describe("生长参照：中国（Zong & Li 2013）", () => {
  it("CHN-01 范围 0–216 月", () => {
    expect(referenceRange("CHINA")).toEqual({ min: 0, max: 216 });
  });

  it("CHN-02 男 0 月 M=50.4", () => {
    expect(lookupLms("CHINA", "male", 0).m).toBeCloseTo(50.4, 4);
  });

  it("CHN-03 男 24 月 M=88.5", () => {
    expect(lookupLms("CHINA", "male", 24).m).toBeCloseTo(88.5, 4);
  });

  it("CHN-04 女 24 月 M=87.2", () => {
    expect(lookupLms("CHINA", "female", 24).m).toBeCloseTo(87.2, 4);
  });

  it("CHN-05 同月龄重复行保留站立身高（36 月男 96.8）", () => {
    expect(lookupLms("CHINA", "male", 36).m).toBeCloseTo(96.8, 4);
  });

  it("CHN-06 非节点月龄线性插值（7 月男）", () => {
    const lms = lookupLms("CHINA", "male", 7);
    expect(lms.l).toBeCloseTo(0.51, 4);
    expect(lms.m).toBeCloseTo(69.8, 4);
    expect(lms.s).toBeCloseTo(0.03515, 5);
  });

  it("CHN-07 中位数 SDS=0", () => {
    expect(heightSds("CHINA", "male", 24, 88.5)).toBeCloseTo(0, 6);
  });

  it("CHN-08 偏低 SDS", () => {
    expect(heightSds("CHINA", "male", 24, 86)).toBeCloseTo(-0.715257, 5);
  });

  it("CHN-09 反查 z=2", () => {
    expect(valueAtZ("CHINA", "male", 24, 2)).toBeCloseTo(95.696322, 5);
  });

  it("CHN-10 反查 z=-2", () => {
    expect(valueAtZ("CHINA", "male", 24, -2)).toBeCloseTo(81.606479, 5);
  });

  it("CHN-11 百分位换算", () => {
    expect(heightPercentile("CHINA", "male", 24, 86)).toBeCloseTo(23.72, 1);
  });

  it("CHN-12 成人参照与 SD", () => {
    expect(adultReference("CHINA", "male").m).toBeCloseTo(172.7, 4);
    expect(adultReference("CHINA", "female").m).toBeCloseTo(160.6, 4);
    expect(adultSd("CHINA", "male")).toBeCloseTo(6.02723, 5);
    expect(adultSd("CHINA", "female")).toBeCloseTo(5.3801, 5);
  });

  it("CHN-13 月龄越界抛 RangeError", () => {
    expect(() => lookupLms("CHINA", "male", 217)).toThrow(RangeError);
  });

  it("CHN-14 中国标准高于 WHO 同月龄中位（24 月男）", () => {
    expect(lookupLms("CHINA", "male", 24).m).toBeGreaterThan(
      lookupLms("WHO", "male", 24).m,
    );
  });
});
