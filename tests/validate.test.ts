import { describe, expect, it } from "vitest";
import { validateProfile } from "../src/core/validate";
import type { Profile } from "../src/core/types";

const base = (): Profile => ({
  child: { sex: "male" },
  parents: { fatherCm: 175, motherCm: 160 },
});

describe("validateProfile", () => {
  it("VAL-01 父母身高缺失返回两条 required", () => {
    const issues = validateProfile({ child: { sex: "male" }, parents: {} });
    const required = issues.filter((i) => i.code === "required");
    expect(required.map((i) => i.field).sort()).toEqual(["fatherCm", "motherCm"]);
  });

  it("VAL-02 父亲身高超范围", () => {
    const p = base();
    p.parents.fatherCm = 99;
    const issues = validateProfile(p);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "fatherCm", code: "out_of_range" });
  });

  it("VAL-03 母亲身高超范围", () => {
    const p = base();
    p.parents.motherCm = 251;
    const issues = validateProfile(p);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "motherCm", code: "out_of_range" });
  });

  it("VAL-04 仅父母合法", () => {
    expect(validateProfile(base())).toEqual([]);
  });

  it("VAL-05 月龄非整数", () => {
    const p = base();
    p.child.ageMonths = 12.5;
    const issues = validateProfile(p);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "ageMonths", code: "not_integer" });
  });

  it("VAL-06 月龄超范围", () => {
    const p = base();
    p.child.ageMonths = 217;
    const issues = validateProfile(p);
    expect(issues[0]).toMatchObject({ field: "ageMonths", code: "out_of_range" });
  });

  it("VAL-07 有身高缺月龄", () => {
    const p = base();
    p.child.heightCm = 120;
    const issues = validateProfile(p);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "ageMonths", code: "missing_age" });
  });

  it("VAL-08 有体重缺月龄", () => {
    const p = base();
    p.child.weightKg = 30;
    const issues = validateProfile(p);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "ageMonths", code: "missing_age" });
  });

  it("VAL-09 祖辈身高超范围", () => {
    const p = base();
    p.grandparents = { paternalGrandfatherCm: 80 };
    const issues = validateProfile(p);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      field: "paternalGrandfatherCm",
      code: "out_of_range",
    });
  });

  it("VAL-10 旁系亲属身高超范围", () => {
    const p = base();
    p.relatives = [{ relation: "uncle_paternal", heightCm: 300 }];
    const issues = validateProfile(p);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      field: "relatives[0].heightCm",
      code: "out_of_range",
    });
  });

  it("VAL-11 月龄下边界 0 合法", () => {
    const p = base();
    p.child.ageMonths = 0;
    expect(validateProfile(p)).toEqual([]);
  });

  it("VAL-12 月龄上边界 216 合法", () => {
    const p = base();
    p.child.ageMonths = 216;
    expect(validateProfile(p)).toEqual([]);
  });

  it("VAL-13 身高下边界 100 合法", () => {
    const p = base();
    p.parents.fatherCm = 100;
    p.parents.motherCm = 100;
    expect(validateProfile(p)).toEqual([]);
  });

  it("VAL-14 身高上边界 250 合法", () => {
    const p = base();
    p.parents.fatherCm = 250;
    p.parents.motherCm = 250;
    expect(validateProfile(p)).toEqual([]);
  });

  it("VAL-15 非数值身高报 invalid", () => {
    const p = base();
    p.parents.fatherCm = Number.NaN;
    const issues = validateProfile(p);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "fatherCm", code: "invalid" });
  });

  it("VAL-16 身高超过 1 位小数报 too_precise", () => {
    const p = base();
    p.parents.fatherCm = 175.55;
    const issues = validateProfile(p);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "fatherCm", code: "too_precise" });
  });

  it("VAL-17 身高 1 位小数合法", () => {
    const p = base();
    p.parents.fatherCm = 175.5;
    expect(validateProfile(p)).toEqual([]);
  });

  it("VAL-18 孩子身高超过 1 位小数报 too_precise", () => {
    const p = base();
    p.child.ageMonths = 120;
    p.child.heightCm = 140.55;
    const issues = validateProfile(p);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "heightCm", code: "too_precise" });
  });
});
