# 系统模式（System Patterns）

## 架构分层（严格单向依赖）
```
src/ui（app.ts / chart.ts / export.ts / main.ts）
   ↓ 仅调用
src/core（predict 编排 + mph/cmh/khamis-roche/family/lms/growth/validate）
   ↓ 仅引用
src/data（who-height-lms / china-height-lms / khamis-roche 系数，脚本自动生成，勿手改）
```
- UI 无业务逻辑；core 无 DOM 依赖（ui.test 用 jsdom 单独覆盖）。

## 预测编排（predict.ts）
1. `validateProfile` 失败 → 抛 `ValidationError`（携带 issues）。
2. 基础方法选择：月龄∈[48,210] 且有身高体重 → KR；否则有月龄+身高 → CMH；否则 MPH。
3. 家族修正：`familyAdjustment(profile, ANCHOR_STANDARD)`，有任一祖辈/旁系 → 档位 enhanced。
4. **点估 = 基础方法值 + 亲属修正，为绝对 cm，不做标准间映射**（v0.4 方案 B）。
5. 区间对称：basic ±8.5 / advanced ±5 / enhanced ±4，结果保留 1 位小数。
6. 曲线：z 线性插值（孩子当前 SDS → 成人 SDS，按所选标准 LMS 反查）；百分位曲线 19 点（0–216 月，步长 12）。

## 锚点设计（关键）
- `ANCHOR_STANDARD = "WHO"`：MPH/KR/CMH 与亲属标准化全部在 WHO 锚点内计算。
- 所选标准只用于：孩子当前 SDS/百分位展示、百分位曲线、逐年曲线的 LMS 反查。
- KR 用英寸/磅内部换算（1in=2.54cm，1kg=2.2046226218487757lb）。

## LMS 数学（lms.ts）
- z = ((X/M)^L − 1)/(L·S)；L=0 时 z = ln(X/M)/S；反函数与正态 CDF（erf 逼近）/分位点（Acklam）。

## 数据生成
- `npm run generate:data`：从 WHO anthro/anthroplus 与 childsds 仓库下载源数据生成 TS 常量；优先读 `scripts/*-source/` 本地缓存；**离线无法重新生成，源文件已生成勿手改**。

## 校验约定（validate.ts）
- code：`required / invalid / out_of_range / too_precise / not_integer / missing_age`。
- `invalid`：字段为非有限数值（如 NaN），提示"需为有效数值，请确认"。
- 身高（含孩子身高 heightCm）允许整数或 1 位小数（`hasAtMostOneDecimal`，容差 1e-9）；月龄必须 0–216 整数；有身高/体重缺月龄 → missing_age；体重不限小数位。
- `FIELD_LABELS` / `fieldLabel`（validate.ts 导出）把字段 key 转为中文标签；所有 message 均为自包含中文文案，UI 直接展示 message，不再拼接 field key。

## UI 约定
- 单文件 innerHTML 模板 + 事件绑定；动态用户文本插入 innerHTML 前必须 `escapeHtml`。
- 图表为内联 SVG（chart.ts），aria-label 使用动态 `result.referenceLabel`。
- 导出（export.ts）动态 import 代码分割：html-to-image 截图 → JPG 下载 / jsPDF 嵌入 PDF。

## 测试约定
- Vitest：core 用 node 环境，ui.test.ts 用 `// @vitest-environment jsdom`。
- 用例编号（VAL-*/LMS-*/WHO-*/CHN-*/MPH-*/KR-*/CMH-*/FAM-*/ORCH-*/UI-*/EXP-*/PRIV-*）与 测试用例文档.md 一一对应；期望值为独立计算后冻结。
- 常量集中在 core/constants.ts；文档 §2.2 有常量表。
