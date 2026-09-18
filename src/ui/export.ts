import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

async function nodeToJpeg(node: HTMLElement): Promise<string> {
  return toJpeg(node, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
  });
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function exportJpg(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await nodeToJpeg(node);
  downloadDataUrl(dataUrl, `${filename}.jpg`);
}

export async function exportPdf(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await nodeToJpeg(node);
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("结果卡片渲染失败"));
    image.src = dataUrl;
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  const ratio = image.height / image.width;
  let drawWidth = maxWidth;
  let drawHeight = drawWidth * ratio;
  if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = drawHeight / ratio;
  }

  pdf.addImage(dataUrl, "JPEG", margin, margin, drawWidth, drawHeight);
  pdf.save(`${filename}.pdf`);
}
