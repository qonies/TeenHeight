# 技术上下文（Tech Context）

## 技术栈
- 纯前端：Vite 7 + TypeScript 5.9（strict, noUnusedLocals/Parameters, noEmit）
- 测试：Vitest 3（node + jsdom 环境）
- 依赖（runtime）：html-to-image ^1.11.13（JPG 截图）、jspdf ^3.0.1（PDF）
- 无框架（原生 DOM），无路由，单页

## 常用命令（Windows / Node 22+）
| 命令 | 作用 |
|---|---|
| `npm run dev` | Vite 开发服务器 |
| `npm run build` | `tsc --noEmit` + vite build（产物在 dist/） |
| `npm test` / `npm run test:watch` | Vitest 一次性 / 监听 |
| `npm run typecheck` | tsc --noEmit |
| `npm run generate:data` | 重新生成 WHO/中国 LMS 数据（需联网） |

## 环境注意
- 实际开发环境为 Node v24.13.0 + npm 11；`npm install` 时会有 EBADENGINE 警告（个别传递依赖声明旧 engine），可忽略，安装与测试均正常。
- npm 有 `electron_mirror` 用户配置警告，可忽略。
- PowerShell 下 npm 输出可能被 shell integration 截断，必要时 `npm test > file 2>&1` 再读文件。
- Git 仓库已 init 但从未提交（master 无 commit），所有文件处于 untracked 状态。

## 文件地图
```
需求文档.md（v0.5）/ 测试用例文档.md（v1.5）   # 需求与测试基准
index.html / vite.config.ts / tsconfig.json
src/core/   predict.ts(编排) types.ts validate.ts constants.ts
            mph.ts cmh.ts khamis-roche.ts family.ts lms.ts growth.ts
src/data/   who-height-lms.ts(228月) china-height-lms.ts(216月) khamis-roche.ts
src/ui/     main.ts app.ts chart.ts export.ts styles.css
scripts/    generate-who-data.mjs generate-china-data.mjs
tests/      9 个 *.test.ts（对应测试用例文档编号）
memory-bank/
```

## 约束
- 单位仅 cm/kg；月龄整数 0–216；预测终点 216 月。
- 性能：计算 <100ms（纯同步计算，已满足）；首屏 <2s。
- 国际化：仅简体中文，文案暂未抽离（需求预留）。
- 版本对应：package.json 0.2.1 ↔ 需求文档 v0.5 ↔ 测试用例文档 v1.5。
