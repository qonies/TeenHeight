import { MPH_SEX_OFFSET } from "./constants";
import type { Sex } from "./types";

/** 父母平均身高法（Mid-Parental Height）。 */
export function midParentalHeight(
  fatherCm: number,
  motherCm: number,
  sex: Sex,
): number {
  const offset = sex === "male" ? MPH_SEX_OFFSET : -MPH_SEX_OFFSET;
  return (fatherCm + motherCm + offset) / 2;
}
