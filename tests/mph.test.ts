import { describe, expect, it } from "vitest";
import { midParentalHeight } from "../src/core/mph";

describe("父母平均身高法 MPH", () => {
  it("MPH-01 男 (175,160) = 174.0", () => {
    expect(midParentalHeight(175, 160, "male")).toBeCloseTo(174.0, 10);
  });

  it("MPH-02 女 (175,160) = 161.0", () => {
    expect(midParentalHeight(175, 160, "female")).toBeCloseTo(161.0, 10);
  });

  it("MPH-03 男 (170,170) = 176.5", () => {
    expect(midParentalHeight(170, 170, "male")).toBeCloseTo(176.5, 10);
  });

  it("MPH-04 女 (180,150) = 158.5", () => {
    expect(midParentalHeight(180, 150, "female")).toBeCloseTo(158.5, 10);
  });
});
