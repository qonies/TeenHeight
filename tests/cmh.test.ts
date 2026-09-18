import { describe, expect, it } from "vitest";
import { conditionalTargetHeight } from "../src/core/cmh";

describe("CMH 校正", () => {
  it("CMH-01 偏低 SDS 向下修正", () => {
    expect(conditionalTargetHeight(174, -0.696967)).toBeCloseTo(172.606067, 5);
  });

  it("CMH-02 中位 SDS 不修正", () => {
    expect(conditionalTargetHeight(174, 0)).toBeCloseTo(174, 10);
  });

  it("CMH-03 偏高 SDS 向上修正", () => {
    expect(conditionalTargetHeight(174, 1)).toBeCloseTo(176, 10);
  });
});
