# 当前进度（Progress）

## 当前状态
功能开发与测试基本完成（M1–M4），111 用例全绿；处于需求/代码一致性治理与文档维护阶段。

## 已完成
- [x] 录入表单（必填/折叠选填/动态亲属行/示例与清空）
- [x] MPH / CMH / Khamis-Roche 预测 + 三档精度与对称区间
- [x] 家族亲属加权修正（±4cm 上限，实验性标注）
- [x] WHO（0–228 月）与中国（0–216 月）双标准、LMS 插值、百分位曲线
- [x] 逐年预测曲线 + SVG 图表（动态 aria-label）
- [x] JPG/PDF 导出（动态 import）
- [x] 备注字段（note）录入与结果卡展示（HTML 转义）
- [x] 身高"最多 1 位小数"校验（too_precise）
- [x] 重复亲属关系"按均值计算"提示
- [x] 方案 B 重构：预测值不随参照标准切换变化（移除 mapAdultHeight）
- [x] UI 硬编码 WHO 文案清理（chart aria-label/页头/页脚/index.html/package.json）
- [x] 文档对齐：需求 v0.4、测试文档 v1.4、package.json 0.2.0
- [x] 表单分组布局：父母身高一行、祖父母一行、外祖父母一行，各分组独立清空按钮（.pair-row 布局，含窄屏适配，UI-09）
- [x] 校验增强：新增 `invalid` code（非数值提示"需为有效数值"）；孩子身高补 `too_precise`（1 位小数）校验（VAL-18）
- [x] 错误提示中文化：validate.ts FIELD_LABELS/fieldLabel，message 自包含中文；UI 不再拼接英文 field key
- [x] 文档一致性：测试文档 v1.5 删除残留 MAP-01~05；需求文档 v0.5 更新 §4.2/§4.3.2/§4.1.2；package.json 0.2.1
- [x] 开源发布配套：LICENSE（MIT）+ README.md（功能/方法/数据来源/隐私/快速开始），package.json 声明 license: MIT

## 测试基线（最近一次全量运行）
- `npm run typecheck` ✅；`npm test` ✅ 9 文件 111 用例全过；`npm run build` ✅
- 用例数变化：109（初版）→ 105（−5 MAP +1 ORCH-18）→ 109（+VAL-16/17、ORCH-19、UI-08）→ 110（+UI-09）→ 111（+VAL-18；VAL-15 期望改为 invalid）

## 已知遗留问题 / 待办
- [ ] 说明页（方法简介、公式与数据来源、常见问题）仍是页脚简要文字，未做独立页面（需求 §7.3）。
- [ ] 重复/矛盾数据中的"矛盾数据"（如身高与月龄明显不符）未检测，仅做了重复关系提示。
- [ ] 文案未抽离为 i18n 资源（需求预留多语言）。
- [ ] 导出 JPG/PDF 与隐私项（EXP-01/02、PRIV-01）依赖真实浏览器，仍为手工验收。
- [ ] 可访问性（键盘完整操作、颜色对比）未系统化审计（M4 部分完成）。
- [ ] CMH_K=2.0、FAMILY_GAIN=0.5 等参数未用真实数据标定（文档已标注实验性）。
- [ ] ~~Git 仓库尚未做过首次提交~~ ✅ 已完成：GitHub 公开仓库 qonies/TeenHeight，首次提交 240d544（2026-09-18）。

## 变更历史（摘要）
- v0.5 需求：§4.2 校验文案明确"非数值需为有效数值/越界请确认数值"与身高 1 位小数（含孩子身高）；§4.3.2 KR 定位改为"自动选用为基础方法（替代 CMH），不满足则回退 CMH/MPH"。
- v1.5 测试文档：VAL-15 期望改 `invalid`；+VAL-18（孩子身高 too_precise）；删除残留 MAP-01~05；追溯矩阵同步。
- 第二轮一致性修复：validate.ts（invalid code、孩子身高 too_precise、FIELD_LABELS 中文化）、app.ts（错误提示只渲染 message）、predict.ts（ValidationError 中文、亲属修正量精度统一 1 位）、package.json 0.2.1。
- v0.4 需求：方案 B（预测值与标准解耦），删除人口映射 mapAdultHeight；重写 ORCH-14~17、UI-07；新增 ORCH-18；移除 MAP-01~05。
- v1.3 测试文档：+VAL-16/17、ORCH-19、UI-08；追溯矩阵同步。
- v1.4 测试文档：+UI-09（分组清空按钮）。
- 表单分组布局：父母/祖父母/外祖父母各占一行并带独立清空按钮（app.ts 模板 + clearInputs + styles.css `.pair-row`）。
- B 类一致性修复：note 字段、too_precise 校验、重复亲属提示、决策 #2/#7 矛盾消除、数据模型文档与实现对齐、版本号统一。
