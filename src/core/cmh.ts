import { CMH_K } from "./constants";

/**
 * 校正父母平均身高（CMH 近似模型）。
 * correctedTarget = MPH + K × 孩子当前身高 SDS
 * K 为可标定参数，默认 CMH_K。
 */
export function conditionalTargetHeight(
  mph: number,
  childSds: number,
  k: number = CMH_K,
): number {
  return mph + k * childSds;
}
