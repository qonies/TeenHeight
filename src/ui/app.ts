import { predict, ValidationError } from "../core/predict";
import { validateProfile } from "../core/validate";
import type {
  ChildInput,
  GrandparentsInput,
  Profile,
  ReferenceStandard,
  Relative,
  RelativeRelation,
  Sex,
  Tier,
} from "../core/types";
import { renderGrowthChart } from "./chart";

const RELATION_LABELS: Record<RelativeRelation, string> = {
  uncle_paternal: "叔伯（父系男性）",
  aunt_paternal: "姑（父系女性）",
  aunt_maternal: "姨（母系女性）",
  uncle_maternal: "舅（母系男性）",
};

const TIER_LABELS: Record<Tier, string> = {
  basic: "基础精度",
  advanced: "进阶精度",
  enhanced: "增强精度",
};

const METHOD_LABELS: Record<string, string> = {
  MPH: "父母平均身高法（MPH）",
  CMH: "校正父母平均身高（CMH 近似）",
  KR: "Khamis-Roche 法",
  "family-adjusted": "基础方法 + 家族亲属加权修正",
};

function template(): string {
  const relationOptions = Object.entries(RELATION_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");

  return `
  <header class="page-header">
    <h1>子女身高预测</h1>
    <p class="subtitle">综合父母与亲属身高、结合儿童生长标准（WHO / 中国）预测成年身高 · 纯本地计算，不存储任何数据</p>
  </header>

  <form id="predict-form" class="card" novalidate>
    <fieldset>
      <legend>基本信息（必填）</legend>
      <div class="grid">
        <label class="field">
          <span>孩子性别</span>
          <span class="radio-group">
            <label><input type="radio" name="sex" value="male" checked /> 男孩</label>
            <label><input type="radio" name="sex" value="female" /> 女孩</label>
          </span>
        </label>
        <label class="field">
          <span>生长标准</span>
          <select id="standard">
            <option value="WHO" selected>WHO 儿童生长标准</option>
            <option value="CHINA">中国儿童生长标准</option>
          </select>
        </label>
      </div>
      <div class="pair-row">
        <label class="field">
          <span>父亲身高（cm）</span>
          <input id="father" type="number" min="100" max="250" step="0.1" placeholder="如 175" />
        </label>
        <label class="field">
          <span>母亲身高（cm）</span>
          <input id="mother" type="number" min="100" max="250" step="0.1" placeholder="如 160" />
        </label>
        <button type="button" id="clear-parents" class="btn-ghost clear-group" aria-label="清空父母身高">清空</button>
      </div>
    </fieldset>

    <details>
      <summary>孩子当前信息（选填，填写可提升精度）</summary>
      <div class="grid">
        <label class="field"><span>月龄（0–216）</span><input id="childAge" type="number" min="0" max="216" step="1" placeholder="如 120" /></label>
        <label class="field"><span>当前身高（cm）</span><input id="childHeight" type="number" min="30" max="250" step="0.1" placeholder="如 140" /></label>
        <label class="field"><span>体重（kg）</span><input id="childWeight" type="number" min="1" max="200" step="0.1" placeholder="如 32" /></label>
      </div>
    </details>

    <details>
      <summary>祖辈身高（选填，填写可提升精度）</summary>
      <div class="pair-row">
        <label class="field"><span>祖父（cm）</span><input id="pgf" type="number" min="100" max="250" step="0.1" /></label>
        <label class="field"><span>祖母（cm）</span><input id="pgm" type="number" min="100" max="250" step="0.1" /></label>
        <button type="button" id="clear-paternal" class="btn-ghost clear-group" aria-label="清空祖父母">清空</button>
      </div>
      <div class="pair-row">
        <label class="field"><span>外祖父（cm）</span><input id="mgf" type="number" min="100" max="250" step="0.1" /></label>
        <label class="field"><span>外祖母（cm）</span><input id="mgm" type="number" min="100" max="250" step="0.1" /></label>
        <button type="button" id="clear-maternal" class="btn-ghost clear-group" aria-label="清空外祖父母">清空</button>
      </div>
    </details>

    <details>
      <summary>旁系亲属身高（选填，叔伯/姑/姨/舅，可添加多位）</summary>
      <div id="relatives"></div>
      <button type="button" id="add-relative" class="btn-secondary">+ 添加一位亲属</button>
    </details>

    <details>
      <summary>备注（选填）</summary>
      <label class="field">
        <span>备注（仅本地展示）</span>
        <textarea id="note" rows="2" maxlength="200" placeholder="例如：身高测量于学校体检"></textarea>
      </label>
    </details>

    <div class="actions">
      <button type="submit" class="btn-primary">开始预测</button>
      <button type="button" id="fill-example" class="btn-secondary">填入示例</button>
      <button type="button" id="clear-form" class="btn-ghost">一键清空</button>
    </div>

    <ul id="errors" class="errors" hidden></ul>
  </form>

  <section id="result" hidden>
    <div class="result-actions">
      <button type="button" id="export-jpg" class="btn-secondary">导出 JPG</button>
      <button type="button" id="export-pdf" class="btn-secondary">导出 PDF</button>
    </div>
    <div id="result-card"></div>
  </section>

  <footer class="page-footer">
    <p>方法：父母平均身高法（MPH）、Khamis-Roche 法、CMH 近似；百分位参照可选 WHO 或中国儿童生长标准，结果页标注本次所用标准。</p>
    <p>本工具仅供家庭参考，不构成医学建议。</p>
  </footer>

  <template id="relative-row-template">
    <div class="relative-row">
      <select class="relative-relation">${relationOptions}</select>
      <input class="relative-height" type="number" min="100" max="250" step="0.1" placeholder="身高 cm" />
      <button type="button" class="remove-relative btn-ghost">删除</button>
    </div>
  </template>
  `;
}

function num(root: ParentNode, id: string): number | undefined {
  const input = root.querySelector<HTMLInputElement>(`#${id}`);
  if (!input) return undefined;
  const raw = input.value.trim();
  if (raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
}

/** 备注等自由文本插入 innerHTML 前的转义。 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function mountApp(root: HTMLElement): void {
  root.innerHTML = template();

  const form = root.querySelector<HTMLFormElement>("#predict-form")!;
  const relativesContainer = root.querySelector<HTMLDivElement>("#relatives")!;
  const rowTemplate = root.querySelector<HTMLTemplateElement>("#relative-row-template")!;
  const errors = root.querySelector<HTMLUListElement>("#errors")!;
  const resultSection = root.querySelector<HTMLElement>("#result")!;
  const resultCard = root.querySelector<HTMLDivElement>("#result-card")!;

  function addRelativeRow(): void {
    const fragment = rowTemplate.content.cloneNode(true) as DocumentFragment;
    const row = fragment.querySelector<HTMLDivElement>(".relative-row")!;
    row.querySelector<HTMLButtonElement>(".remove-relative")!.addEventListener("click", () => {
      row.remove();
    });
    relativesContainer.appendChild(fragment);
  }

  function collectProfile(): Profile {
    const checked = form.querySelector<HTMLInputElement>('input[name="sex"]:checked');
    const sex: Sex = checked?.value === "female" ? "female" : "male";

    const child: ChildInput = { sex };
    const ageMonths = num(form, "childAge");
    if (ageMonths !== undefined) child.ageMonths = ageMonths;
    const heightCm = num(form, "childHeight");
    if (heightCm !== undefined) child.heightCm = heightCm;
    const weightKg = num(form, "childWeight");
    if (weightKg !== undefined) child.weightKg = weightKg;

    const parents = {
      fatherCm: num(form, "father"),
      motherCm: num(form, "mother"),
    };

    const grandparents: GrandparentsInput = {
      paternalGrandfatherCm: num(form, "pgf"),
      paternalGrandmotherCm: num(form, "pgm"),
      maternalGrandfatherCm: num(form, "mgf"),
      maternalGrandmotherCm: num(form, "mgm"),
    };

    const relatives: Relative[] = [];
    relativesContainer.querySelectorAll<HTMLDivElement>(".relative-row").forEach((row) => {
      const relation = row.querySelector<HTMLSelectElement>(".relative-relation")!.value as RelativeRelation;
      const heightInput = row.querySelector<HTMLInputElement>(".relative-height")!;
      const raw = heightInput.value.trim();
      if (raw === "") return;
      const height = Number(raw);
      if (Number.isFinite(height)) {
        relatives.push({ relation, heightCm: height });
      }
    });

    const profile: Profile = { child, parents, grandparents, relatives };
    const note = root.querySelector<HTMLTextAreaElement>("#note")?.value.trim();
    if (note) profile.note = note;
    return profile;
  }

  function clearErrors(): void {
    errors.hidden = true;
    errors.innerHTML = "";
  }

  function showIssues(messages: string[]): void {
    errors.hidden = false;
    errors.innerHTML = messages.map((m) => `<li>${m}</li>`).join("");
  }

  function renderResult(profile: Profile, result: ReturnType<typeof predict>): void {
    const interval = result.intervalCm;
    const yearlyRows = result.yearly
      .map((point) => {
        const years = (point.ageMonths / 12).toFixed(1).replace(/\.0$/, "");
        return `<tr><td>${years} 岁</td><td>${point.heightCm.toFixed(1)} cm</td></tr>`;
      })
      .join("");

    resultCard.innerHTML = `
      <div class="result-head">
        <div class="result-number">
          <span class="value">${result.pointEstimateCm.toFixed(1)}</span><span class="unit">cm</span>
          <p class="range">预测区间 ${interval.low.toFixed(1)} – ${interval.high.toFixed(1)} cm（±${interval.halfWidth}）</p>
        </div>
        <div class="badges">
          <span class="badge badge-${result.tier}">${TIER_LABELS[result.tier]}</span>
          <span class="badge badge-method">${METHOD_LABELS[result.method] ?? result.method}</span>
          <span class="badge badge-standard">${result.referenceLabel}</span>
        </div>
      </div>
      <div class="chart" id="chart-container"></div>
      <h3>逐年预测</h3>
      <div class="table-wrap">
        <table class="yearly-table"><thead><tr><th>年龄</th><th>预测身高</th></tr></thead><tbody>${yearlyRows}</tbody></table>
      </div>
      <h3>预测依据</h3>
      <ul class="explanation">${result.explanation.map((line) => `<li>${line}</li>`).join("")}</ul>
      ${profile.note ? `<p class="note">备注：${escapeHtml(profile.note)}</p>` : ""}
      <p class="disclaimer">本结果仅供参考，不构成医学建议。孩子的最终身高受营养、睡眠、运动、疾病等多种因素影响。</p>
    `;

    const chartContainer = resultCard.querySelector<HTMLDivElement>("#chart-container")!;
    const current =
      profile.child.ageMonths !== undefined && profile.child.heightCm !== undefined
        ? { ageMonths: profile.child.ageMonths, heightCm: profile.child.heightCm }
        : undefined;
    chartContainer.appendChild(renderGrowthChart(result, { current }));

    resultSection.hidden = false;
    if (typeof resultSection.scrollIntoView === "function") {
      try {
        resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        /* jsdom 等环境不支持滚动，忽略 */
      }
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    const profile = collectProfile();
    const issues = validateProfile(profile);
    if (issues.length > 0) {
      showIssues(issues.map((issue) => issue.message));
      resultSection.hidden = true;
      return;
    }
    const standard =
      (form.querySelector<HTMLSelectElement>("#standard")?.value as ReferenceStandard) ??
      "WHO";
    try {
      renderResult(profile, predict(profile, { standard }));
    } catch (error) {
      if (error instanceof ValidationError) {
        showIssues(error.issues.map((issue) => issue.message));
      } else {
        showIssues([(error as Error).message]);
      }
      resultSection.hidden = true;
    }
  });

  root.querySelector<HTMLButtonElement>("#add-relative")!.addEventListener("click", addRelativeRow);

  function clearInputs(ids: string[]): void {
    for (const id of ids) {
      const input = form.querySelector<HTMLInputElement>(`#${id}`);
      if (input) input.value = "";
    }
  }
  root.querySelector<HTMLButtonElement>("#clear-parents")!.addEventListener("click", () =>
    clearInputs(["father", "mother"]),
  );
  root.querySelector<HTMLButtonElement>("#clear-paternal")!.addEventListener("click", () =>
    clearInputs(["pgf", "pgm"]),
  );
  root.querySelector<HTMLButtonElement>("#clear-maternal")!.addEventListener("click", () =>
    clearInputs(["mgf", "mgm"]),
  );

  root.querySelector<HTMLButtonElement>("#clear-form")!.addEventListener("click", () => {
    form.reset();
    relativesContainer.innerHTML = "";
    clearErrors();
    resultSection.hidden = true;
  });

  root.querySelector<HTMLButtonElement>("#fill-example")!.addEventListener("click", () => {
    const set = (id: string, value: string) => {
      const input = form.querySelector<HTMLInputElement>(`#${id}`);
      if (input) input.value = value;
    };
    form.querySelector<HTMLInputElement>('input[name="sex"][value="male"]')!.checked = true;
    set("father", "175");
    set("mother", "160");
    set("childAge", "120");
    set("childHeight", "140");
    set("childWeight", "32");
    set("pgf", "172");
    set("pgm", "158");
    set("mgf", "170");
    set("mgm", "156");
  });

  root.querySelector<HTMLButtonElement>("#export-jpg")!.addEventListener("click", async () => {
    const { exportJpg } = await import("./export");
    await exportJpg(resultCard, "身高预测结果");
  });

  root.querySelector<HTMLButtonElement>("#export-pdf")!.addEventListener("click", async () => {
    const { exportPdf } = await import("./export");
    await exportPdf(resultCard, "身高预测结果");
  });
}
