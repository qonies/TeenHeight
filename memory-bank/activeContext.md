# 活跃上下文（Active Context）

## 最近完成（2026-09-18，第二轮：文档/代码一致性修复）
0. **分析驱动的修复（用户确认"全部修复"）**：
   - validate.ts：新增 `invalid` code（非有限数值，提示"需为有效数值，请确认"）；孩子身高 heightCm 补上 `too_precise`（1 位小数）校验，与其余身高规则一致；新增 `FIELD_LABELS`/`fieldLabel`（导出）把字段 key 转中文，所有 message 自包含中文。
   - app.ts：showIssues 只渲染 issue.message（原先 `${field}：${message}` 造成 "fatherCm：fatherCm 需在…" 重复且暴露英文 key）。
   - predict.ts：ValidationError message 用 fieldLabel（中文）；explanation 亲属修正量 toFixed(2)→toFixed(1)，与 familyAdjustmentCm 字段（round1）精度一致。
   - types.ts：ValidationCode 增加 `invalid`。
   - 测试：VAL-15 改期望 `invalid`；新增 VAL-18（孩子身高 140.55 → too_precise）；UI-01 断言改"父亲身高"。
   - 测试文档 v1.5：VAL-15 更新、+VAL-18、**删除残留的 MAP-01~05**（mapAdultHeight 已删）、追溯矩阵同步。
   - 需求文档 v0.5：§4.2 校验文案（含"请确认数值"）；§4.3.2 KR 定位改为"自动选用为基础方法（替代 CMH），否则回退"；§4.1.2 孩子身高注明"整数或 1 位小数"。
   - package.json 0.2.0 → 0.2.1；techContext 版本对应/文件地图同步。
1. 环境实测：Node v24.13.0 安装依赖有 EBADENGINE 警告但不影响（已记入 techContext）。

## 最近完成（2026-09-18，第一轮）
0. **表单分组布局（用户需求）**：父母身高一行、祖父母一行、外祖父母一行，各带独立清空按钮。
   - app.ts：基本信息区父亲/母亲移出通用网格放入 `.pair-row`；祖辈区拆为两行；mountApp 新增 `clearInputs` 与 #clear-parents/#clear-paternal/#clear-maternal 绑定。
   - styles.css：`.pair-row`（1fr 1fr auto，按钮底对齐）+ 560px 窄屏媒体查询。
   - 测试：UI-09 验证分组清空互不影响；测试文档 v1.4。
1. **方案 B 重构（用户确认）**：切换参照标准不再改变预测成年身高。
   - predict.ts：移除 `mapAdultHeight` 调用，`rawPoint = baseValue + 亲属修正`。
   - growth.ts：删除 `mapAdultHeight`；锚点注释更新。
   - 附带修复：familyAdjustmentCm 展示值与实际生效值一致（原先中国标准下差 ~0.16cm）。
   - UI 硬编码 WHO 文案全部动态化/中性化（chart aria-label、页头、页脚、index.html、package.json）。
2. **B 类一致性修复**：
   - note 字段：types.ts Profile + UI 备注 details + collectProfile + 结果卡展示（escapeHtml 防注入）+ `.note` 样式。
   - 身高 1 位小数校验：validate.ts 新增 `too_precise` code 与 `hasAtMostOneDecimal`（容差 1e-9）。
   - 重复亲属提示：predict.ts 统计重复 relation，explanation 提示"已按均值参与计算"；family.ts 导出 RELATION_LABELS 供 core 使用。
   - 需求文档：决策 #2 标注被 #7 扩展；§4.3.3 权重措辞改为"父母 0.5，祖辈/旁系各 0.25"；§6 数据模型与实现字段对齐（reference 联合类型、baseMethod/referenceLabel/childSds/familyAdjustmentCm 等）。
   - package.json 0.1.0 → 0.2.0。
3. **Memory Bank 初始化**：本目录 6 个文件建立。

## 当前测试基线
`npm test`：9 文件 111 用例全过；typecheck/build 均通过。

## 下一步（按优先级建议）
1. 独立说明页（需求 §7.3：方法简介/公式/数据来源/FAQ）。
2. ~~Git 首次提交~~ ✅ 已完成（GitHub 公开仓库 qonies/TeenHeight，首次提交 240d544）。
3. 手工验收 EXP-01/02（JPG/PDF 导出）与 PRIV-01（无网络请求）。
4. "矛盾数据"检测（如身高与月龄严重不符的提示）。
5. 文案抽离 i18n 资源。

## 关键决策记录（勿回退）
- **预测值与标准解耦**是用户明确确认的产品决策（需求 v0.4 决策 #8）。任何"切标准改变预测身高"的行为都视为回归；ORCH-14~18、UI-07 是守卫用例。
- mapAdultHeight 已删除，不要凭记忆恢复；如需跨标准换算须重新评估设计。
- 用户文本进 innerHTML 前必须 escapeHtml（备注功能已开此先例）。
