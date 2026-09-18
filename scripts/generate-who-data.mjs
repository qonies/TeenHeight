import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourceDir = join(__dirname, "who-source");
const outFile = join(root, "src", "data", "who-height-lms.ts");

const SOURCES = {
  "lenanthro.txt":
    "https://raw.githubusercontent.com/WorldHealthOrganization/anthro/HEAD/data-raw/growthstandards/lenanthro.txt",
  "hfawho2007.txt":
    "https://raw.githubusercontent.com/WorldHealthOrganization/anthroplus/HEAD/data-raw/growthstandards/hfawho2007.txt",
};

const DAYS_PER_MONTH = 30.4375;
const MAX_MONTHS = 228;

async function loadSource(name) {
  const local = join(sourceDir, name);
  if (existsSync(local)) return readFile(local, "utf8");
  const res = await fetch(SOURCES[name]);
  if (!res.ok) throw new Error(`下载失败 ${name}: ${res.status}`);
  return res.text();
}

function parseTable(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split(/\t|,|\s+/).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(/\t|,|\s+/).map((c) => c.trim());
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i]));
    return row;
  });
}

const sexName = (v) => (String(v) === "1" ? "male" : "female");

async function build() {
  const lfaText = await loadSource("lenanthro.txt");
  const hfaText = await loadSource("hfawho2007.txt");

  const lfa = parseTable(lfaText);
  const hfa = parseTable(hfaText);

  const byDay = new Map();
  for (const r of lfa) {
    byDay.set(`${sexName(r.sex)}:${Number(r.age)}`, {
      l: Number(r.l),
      m: Number(r.m),
      s: Number(r.s),
    });
  }
  const byMonth = new Map();
  for (const r of hfa) {
    byMonth.set(`${sexName(r.sex)}:${Number(r.age)}`, {
      l: Number(r.l),
      m: Number(r.m),
      s: Number(r.s),
    });
  }

  const out = { male: [], female: [] };
  for (const sex of ["male", "female"]) {
    for (let month = 0; month <= MAX_MONTHS; month++) {
      let row;
      if (month < 60) {
        const day = Math.round(month * DAYS_PER_MONTH);
        row = byDay.get(`${sex}:${day}`);
      } else {
        row = byMonth.get(`${sex}:${month}`);
      }
      if (!row) throw new Error(`缺少 ${sex} month=${month} 的 LMS 数据`);
      out[sex].push([month, row.l, row.m, row.s]);
    }
  }

  const body = `// 由 scripts/generate-who-data.mjs 自动生成，请勿手工修改。
// 数据来源：
//   0-5 岁：WHO Child Growth Standards, length/height-for-age (lenanthro.txt)
//   5-19 岁：WHO Growth Reference 2007, height-for-age (hfawho2007.txt)
//   官方仓库：https://github.com/WorldHealthOrganization/anthro 与 /anthroplus
// 每行格式：[月龄, L, M, S]

export type Sex = "male" | "female";
export type LmsTuple = readonly [number, number, number, number];

export const WHO_AGE_MIN_MONTHS = 0;
export const WHO_AGE_MAX_MONTHS = ${MAX_MONTHS};
export const WHO_DAYS_PER_MONTH = ${DAYS_PER_MONTH};

export const WHO_HEIGHT_LMS: Record<Sex, readonly LmsTuple[]> = {
  male: [
${out.male.map((r) => `    [${r[0]}, ${r[1]}, ${r[2]}, ${r[3]}],`).join("\n")}
  ],
  female: [
${out.female.map((r) => `    [${r[0]}, ${r[1]}, ${r[2]}, ${r[3]}],`).join("\n")}
  ],
};
`;

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, body, "utf8");
  console.log(`已生成 ${outFile}`);
  console.log(`  male 行数: ${out.male.length}, female 行数: ${out.female.length}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
