import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourceDir = join(__dirname, "china-source");
const outFile = join(root, "src", "data", "china-height-lms.ts");

const SOURCE_NAME = "wongchinaheight.txt";
const SOURCE_URL =
  "https://raw.githubusercontent.com/mvogel78/childsds/HEAD/data-raw/wongchinaheight.txt";

async function loadSource() {
  const local = join(sourceDir, SOURCE_NAME);
  if (existsSync(local)) return readFile(local, "utf8");
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`下载失败 ${SOURCE_NAME}: ${res.status}`);
  return res.text();
}

function buildTable(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  const rows = lines.slice(1); // 去掉标题行，第二行为表头

  const male = new Map();
  const female = new Map();
  for (const line of rows) {
    const cols = line.split(/\t+/).map((c) => c.trim());
    if (cols.length < 12) continue;
    const month = Number(cols[0]);
    if (!Number.isFinite(month)) continue;
    // 表头列序：agem male_L male_M male_S ... female_L female_M female_S
    const maleRow = [month, Number(cols[1]), Number(cols[2]), Number(cols[3])];
    const femaleRow = [month, Number(cols[9]), Number(cols[10]), Number(cols[11])];
    // 同月龄重复行（如 36 月的身长/身高过渡）保留后者
    male.set(month, maleRow);
    female.set(month, femaleRow);
  }

  const toSorted = (map) =>
    [...map.values()].sort((a, b) => a[0] - b[0]);
  return { male: toSorted(male), female: toSorted(female) };
}

async function build() {
  const text = await loadSource();
  const { male, female } = buildTable(text);
  const min = male[0][0];
  const max = male[male.length - 1][0];

  const fmt = (rows) =>
    rows.map((r) => `    [${r[0]}, ${r[1]}, ${r[2]}, ${r[3]}],`).join("\n");

  const body = `// 由 scripts/generate-china-data.mjs 自动生成，请勿手工修改。
// 中国儿童生长标准（0–18 岁，城市儿童）身高 LMS。
// 数据来源：公开 R 包 childsds 的 data-raw/wongchinaheight.txt，
//   其引用为 Zong, X.-N. & Li, H. Construction of a New Growth References for
//   China Based on Urban Chinese Children. PLOS ONE 8, e59569 (2013).
//   仓库：https://github.com/mvogel78/childsds
// 说明：原始表为离散月龄节点，运行时对 L/M/S 做线性插值；同月龄重复行保留后者。
// 每行格式：[月龄, L, M, S]

export const CHINA_AGE_MIN_MONTHS = ${min};
export const CHINA_AGE_MAX_MONTHS = ${max};

export const CHINA_HEIGHT_LMS: Record<
  "male" | "female",
  readonly (readonly [number, number, number, number])[]
> = {
  male: [
${fmt(male)}
  ],
  female: [
${fmt(female)}
  ],
};
`;

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, body, "utf8");
  console.log(`已生成 ${outFile}`);
  console.log(`  male 节点: ${male.length}, female 节点: ${female.length}, 范围 ${min}-${max} 月`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
