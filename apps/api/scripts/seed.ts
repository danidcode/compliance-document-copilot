import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import { env } from "../src/config/env.js";
import { pool } from "../src/db/pool.js";
import { ChunkRepository } from "../src/repositories/chunkRepository.js";
import { DocumentRepository } from "../src/repositories/documentRepository.js";
import { OpenAiService } from "../src/services/ai/openAiService.js";
import { DocumentIndexingService } from "../src/services/documents/documentIndexingService.js";
import { PdfTextExtractor } from "../src/services/documents/pdfTextExtractor.js";

async function main() {
  await mkdir(env.UPLOAD_DIR, { recursive: true });

  const pdfPath = path.join(env.UPLOAD_DIR, "acme-compliance-policy.pdf");
  await writeExamplePdf(pdfPath);

  const documents = new DocumentRepository(pool);
  const chunks = new ChunkRepository(pool);
  const ai = new OpenAiService();
  const indexing = new DocumentIndexingService(documents, chunks, new PdfTextExtractor(), ai);

  const document = await documents.create({
    name: "ACME Compliance Policy",
    originalName: "acme-compliance-policy.pdf",
    mimeType: "application/pdf",
    sizeBytes: (await readFile(pdfPath)).byteLength,
    storagePath: pdfPath,
    metadata: {
      ingestionSource: "seed",
      department: "compliance",
      jurisdiction: "US"
    }
  });

  const result = await indexing.indexUploadedDocument(document, pdfPath);
  console.log(`Seeded ${result.document.name} with ${result.chunksIndexed} chunks.`);
}

async function writeExamplePdf(filePath: string) {
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 56 });

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<void>((resolve) => doc.on("end", resolve));

  doc.fontSize(18).text("ACME Compliance Policy", { underline: true });
  doc.moveDown();
  doc
    .fontSize(11)
    .text(
      "Employees must complete annual compliance training by March 31 each year. The compliance office records completion evidence and escalates overdue training to department leaders."
    );
  doc.moveDown();
  doc.text(
    "Customer records containing personal data must be retained for seven years unless a legal hold requires longer preservation. Access to regulated records is reviewed quarterly."
  );
  doc.addPage();
  doc.fontSize(18).text("Incident Response Standard", { underline: true });
  doc.moveDown();
  doc
    .fontSize(11)
    .text(
      "Suspected data incidents must be reported to the security team within 24 hours. The incident commander documents impact, affected systems, remediation steps, and customer notification decisions."
    );
  doc.moveDown();
  doc.text(
    "Vendors that process confidential information must complete a risk assessment before onboarding and annually thereafter. High-risk vendors require executive approval."
  );

  doc.end();
  await finished;
  await writeFile(filePath, Buffer.concat(chunks));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
