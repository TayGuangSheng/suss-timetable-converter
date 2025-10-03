import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

export async function extractPdfText(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const doc = await pdfjs.getDocument({ url }).promise;
    const out: Array<{page:number;text:string}> = [];
    const n = doc.numPages;
    for (let p = 1; p <= n; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const lines = content.items
        .map((it: any) => ("str" in it ? it.str : ""))
        .join("\n");
      out.push({ page: p, text: lines });
    }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}
