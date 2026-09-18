// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { mountApp } from "../src/ui/app";

function submit(root: HTMLElement): void {
  root
    .querySelector<HTMLFormElement>("#predict-form")!
    .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
}

describe("界面冒烟（jsdom）", () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    root = document.getElementById("app")!;
    mountApp(root);
  });

  it("UI-01 必填校验拦截并提示", () => {
    submit(root);
    const errors = root.querySelector<HTMLUListElement>("#errors")!;
    expect(errors.hidden).toBe(false);
    expect(errors.textContent).toContain("父亲身高");
    expect(root.querySelector<HTMLElement>("#result")!.hidden).toBe(true);
  });

  it("UI-02 选填分组默认折叠", () => {
    const details = Array.from(root.querySelectorAll("details"));
    expect(details.length).toBeGreaterThanOrEqual(3);
    expect(details.every((d) => !d.open)).toBe(true);
  });

  it("UI-03 旁系亲属可动态增删", () => {
    root.querySelector<HTMLButtonElement>("#add-relative")!.click();
    root.querySelector<HTMLButtonElement>("#add-relative")!.click();
    expect(root.querySelectorAll(".relative-row")).toHaveLength(2);
    root.querySelector<HTMLButtonElement>(".relative-row .remove-relative")!.click();
    expect(root.querySelectorAll(".relative-row")).toHaveLength(1);
  });

  it("UI-04 示例数据产生增强档结果与曲线", () => {
    root.querySelector<HTMLButtonElement>("#fill-example")!.click();
    submit(root);
    const result = root.querySelector<HTMLElement>("#result")!;
    expect(result.hidden).toBe(false);
    expect(result.textContent).toContain("176.8");
    expect(result.textContent).toContain("增强精度");
    expect(result.querySelector("svg")).toBeTruthy();
  });

  it("UI-05 仅父母产生基础档结果", () => {
    root.querySelector<HTMLInputElement>("#father")!.value = "175";
    root.querySelector<HTMLInputElement>("#mother")!.value = "160";
    submit(root);
    const result = root.querySelector<HTMLElement>("#result")!;
    expect(result.hidden).toBe(false);
    expect(result.textContent).toContain("174.0");
    expect(result.textContent).toContain("基础精度");
  });

  it("UI-06 一键清空重置表单并隐藏结果", () => {
    root.querySelector<HTMLButtonElement>("#fill-example")!.click();
    submit(root);
    expect(root.querySelector<HTMLElement>("#result")!.hidden).toBe(false);
    root.querySelector<HTMLButtonElement>("#clear-form")!.click();
    expect(root.querySelector<HTMLElement>("#result")!.hidden).toBe(true);
    expect(root.querySelector<HTMLInputElement>("#father")!.value).toBe("");
  });

  it("UI-07 下拉框切换中国标准后标注更新且预测值不变", () => {
    root.querySelector<HTMLSelectElement>("#standard")!.value = "CHINA";
    root.querySelector<HTMLButtonElement>("#fill-example")!.click();
    submit(root);
    const result = root.querySelector<HTMLElement>("#result")!;
    expect(result.hidden).toBe(false);
    expect(result.textContent).toContain("中国儿童生长标准");
    expect(result.textContent).toContain("176.8");
  });

  it("UI-08 备注输入并展示于结果卡", () => {
    root.querySelector<HTMLInputElement>("#father")!.value = "175";
    root.querySelector<HTMLInputElement>("#mother")!.value = "160";
    root.querySelector<HTMLTextAreaElement>("#note")!.value = "测量于学校体检";
    submit(root);
    const result = root.querySelector<HTMLElement>("#result")!;
    expect(result.hidden).toBe(false);
    expect(result.textContent).toContain("备注：测量于学校体检");
  });

  it("UI-09 分组清空按钮仅清空对应行", () => {
    root.querySelector<HTMLButtonElement>("#fill-example")!.click();
    root.querySelector<HTMLButtonElement>("#clear-parents")!.click();
    root.querySelector<HTMLButtonElement>("#clear-paternal")!.click();
    root.querySelector<HTMLButtonElement>("#clear-maternal")!.click();
    expect(root.querySelector<HTMLInputElement>("#father")!.value).toBe("");
    expect(root.querySelector<HTMLInputElement>("#mother")!.value).toBe("");
    expect(root.querySelector<HTMLInputElement>("#pgf")!.value).toBe("");
    expect(root.querySelector<HTMLInputElement>("#pgm")!.value).toBe("");
    expect(root.querySelector<HTMLInputElement>("#mgf")!.value).toBe("");
    expect(root.querySelector<HTMLInputElement>("#mgm")!.value).toBe("");
    // 孩子当前信息不受分组清空影响
    expect(root.querySelector<HTMLInputElement>("#childAge")!.value).toBe("120");
    expect(root.querySelector<HTMLInputElement>("#childHeight")!.value).toBe("140");
  });
});
