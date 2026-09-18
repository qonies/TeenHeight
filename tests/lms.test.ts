import { describe, expect, it } from "vitest";
import {
  lmsToZScore,
  percentileToZScore,
  zScoreToPercentile,
  zScoreToValue,
} from "../src/core/lms";

describe("LMS 数学", () => {
  it("LMS-01 L!=0 时 X=M 的 z 为 0", () => {
    expect(lmsToZScore(10, 1, 10, 0.1)).toBe(0);
  });

  it("LMS-02 L!=0 时 z=+1", () => {
    expect(lmsToZScore(11, 1, 10, 0.1)).toBeCloseTo(1, 12);
  });

  it("LMS-03 L!=0 时 z=-1", () => {
    expect(lmsToZScore(9, 1, 10, 0.1)).toBeCloseTo(-1, 12);
  });

  it("LMS-04 L=0 时 X=M 的 z 为 0", () => {
    expect(lmsToZScore(10, 0, 10, 0.1)).toBe(0);
  });

  it("LMS-05 L=0 时 z=ln(1.1)/0.1", () => {
    expect(lmsToZScore(11, 0, 10, 0.1)).toBeCloseTo(Math.log(1.1) / 0.1, 12);
  });

  it("LMS-06 反函数 z=1", () => {
    expect(zScoreToValue(1, 1, 10, 0.1)).toBeCloseTo(11, 12);
  });

  it("LMS-07 反函数 z=-2", () => {
    expect(zScoreToValue(-2, 1, 10, 0.1)).toBeCloseTo(8, 12);
  });

  it("LMS-08 z -> X -> z 往返一致", () => {
    for (const z of [-3, -1.5, 0, 0.7, 2.2]) {
      const x = zScoreToValue(z, 0.5, 100, 0.05);
      expect(lmsToZScore(x, 0.5, 100, 0.05)).toBeCloseTo(z, 10);
    }
  });

  it("LMS-09 百分位 z=0 为 0.5", () => {
    expect(zScoreToPercentile(0)).toBeCloseTo(0.5, 8);
  });

  it("LMS-10 百分位 z=1.9599640 约 0.975", () => {
    expect(zScoreToPercentile(1.959964)).toBeCloseTo(0.975, 4);
  });

  it("LMS-11 百分位 z=-1.9599640 约 0.025", () => {
    expect(zScoreToPercentile(-1.959964)).toBeCloseTo(0.025, 4);
  });

  it("LMS-12 反百分位 p=0.5 为 0", () => {
    expect(percentileToZScore(0.5)).toBeCloseTo(0, 6);
  });

  it("LMS-13 反百分位 p=0.975 约 1.9599640", () => {
    expect(percentileToZScore(0.975)).toBeCloseTo(1.959964, 4);
  });

  it("LMS-14 反百分位 p=0.03 约 -1.8807936", () => {
    expect(percentileToZScore(0.03)).toBeCloseTo(-1.8807936, 4);
  });

  it("LMS-15 非法百分位抛错", () => {
    expect(() => percentileToZScore(0)).toThrow(RangeError);
    expect(() => percentileToZScore(1)).toThrow(RangeError);
  });
});
