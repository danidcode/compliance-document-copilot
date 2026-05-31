import path from "node:path";
import { createRequire } from "node:module";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export type ExtractedPage = {
  pageNumber: number;
  text: string;
};

export type ExtractedPdf = {
  pageCount: number;
  pages: ExtractedPage[];
};

export class PdfTextExtractor {
  async extract(buffer: Buffer): Promise<ExtractedPdf> {
    const pdf = await getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
      standardFontDataUrl: getStandardFontDataUrl()
    }).promise;

    const pages: ExtractedPage[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      pages.push({ pageNumber, text });
    }

    return {
      pageCount: pdf.numPages,
      pages
    };
  }
}

function getStandardFontDataUrl(): string {
  const require = createRequire(import.meta.url);
  return `${path.dirname(require.resolve("pdfjs-dist/package.json"))}${path.sep}standard_fonts${path.sep}`;
}
