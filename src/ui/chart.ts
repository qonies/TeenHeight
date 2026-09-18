import type { PredictionResult } from "../core/types";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

function pathFrom(points: Array<[number, number]>): string {
  return points
    .map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(2)},${py.toFixed(2)}`)
    .join(" ");
}

export interface ChartOptions {
  current?: { ageMonths: number; heightCm: number };
}

export function renderGrowthChart(
  result: PredictionResult,
  options: ChartOptions = {},
): SVGSVGElement {
  const width = 760;
  const height = 400;
  const margin = { top: 24, right: 120, bottom: 40, left: 52 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const maxAge = 216;

  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of result.percentiles) {
    minY = Math.min(minY, point.p3);
    maxY = Math.max(maxY, point.p97);
  }
  for (const point of result.yearly) {
    minY = Math.min(minY, point.heightCm);
    maxY = Math.max(maxY, point.heightCm);
  }
  minY = Math.floor((minY - 4) / 5) * 5;
  maxY = Math.ceil((maxY + 4) / 5) * 5;

  const x = (month: number) => margin.left + (month / maxAge) * plotW;
  const y = (value: number) => margin.top + (1 - (value - minY) / (maxY - minY)) * plotH;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    role: "img",
    "aria-label": `生长曲线与预测身高（${result.referenceLabel}）`,
  });
  svg.appendChild(svgEl("rect", { x: 0, y: 0, width, height, fill: "#ffffff" }));

  for (let value = minY; value <= maxY; value += 5) {
    const py = y(value);
    svg.appendChild(
      svgEl("line", {
        x1: margin.left,
        y1: py,
        x2: margin.left + plotW,
        y2: py,
        stroke: "#e2e8f0",
        "stroke-width": 1,
      }),
    );
    const label = svgEl("text", {
      x: margin.left - 8,
      y: py + 4,
      "text-anchor": "end",
      "font-size": 11,
      fill: "#64748b",
    });
    label.textContent = String(value);
    svg.appendChild(label);
  }

  for (let month = 0; month <= maxAge; month += 24) {
    const px = x(month);
    svg.appendChild(
      svgEl("line", {
        x1: px,
        y1: margin.top,
        x2: px,
        y2: margin.top + plotH,
        stroke: "#f1f5f9",
        "stroke-width": 1,
      }),
    );
    const label = svgEl("text", {
      x: px,
      y: margin.top + plotH + 18,
      "text-anchor": "middle",
      "font-size": 11,
      fill: "#64748b",
    });
    label.textContent = `${month / 12}岁`;
    svg.appendChild(label);
  }

  const percentileDefs: Array<[keyof PredictionResult["percentiles"][number], string, number]> = [
    ["p3", "#cbd5e1", 1.5],
    ["p10", "#94a3b8", 1.5],
    ["p50", "#2563eb", 2.5],
    ["p90", "#94a3b8", 1.5],
    ["p97", "#cbd5e1", 1.5],
  ];
  for (const [key, color, strokeWidth] of percentileDefs) {
    const points = result.percentiles.map(
      (point) => [x(point.ageMonths), y(point[key])] as [number, number],
    );
    svg.appendChild(
      svgEl("path", {
        d: pathFrom(points),
        fill: "none",
        stroke: color,
        "stroke-width": strokeWidth,
      }),
    );
  }

  const predicted = result.yearly.map(
    (point) => [x(point.ageMonths), y(point.heightCm)] as [number, number],
  );
  svg.appendChild(
    svgEl("path", {
      d: pathFrom(predicted),
      fill: "none",
      stroke: "#f97316",
      "stroke-width": 3,
      "stroke-dasharray": "7 4",
    }),
  );

  const last = predicted[predicted.length - 1];
  if (last) {
    svg.appendChild(svgEl("circle", { cx: last[0], cy: last[1], r: 5, fill: "#f97316" }));
    const label = svgEl("text", {
      x: last[0] + 8,
      y: last[1] - 8,
      "font-size": 12,
      "font-weight": 700,
      fill: "#c2410c",
    });
    label.textContent = `预测 ${result.pointEstimateCm}cm`;
    svg.appendChild(label);
  }

  const current = options.current;
  if (current && current.ageMonths <= maxAge) {
    svg.appendChild(
      svgEl("circle", {
        cx: x(current.ageMonths),
        cy: y(current.heightCm),
        r: 5,
        fill: "#dc2626",
      }),
    );
  }

  const legend: Array<[string, string]> = [
    ["#2563eb", "P50 中位"],
    ["#94a3b8", "P10 / P90"],
    ["#cbd5e1", "P3 / P97"],
    ["#f97316", "预测身高"],
  ];
  legend.forEach(([color, text], index) => {
    const ly = margin.top + index * 20;
    const lx = margin.left + plotW + 14;
    svg.appendChild(
      svgEl("line", { x1: lx, y1: ly, x2: lx + 20, y2: ly, stroke: color, "stroke-width": 3 }),
    );
    const label = svgEl("text", { x: lx + 26, y: ly + 4, "font-size": 11, fill: "#475569" });
    label.textContent = text;
    svg.appendChild(label);
  });

  return svg;
}
