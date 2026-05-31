import type { DocumentDto } from "@cdc/contracts";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { Badge } from "../../components/ui/badge.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.js";

type DocumentIntakeProps = {
  documents: DocumentDto[];
  isLoading: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
};

export function DocumentIntake({
  documents,
  isLoading,
  isUploading,
  onUpload,
}: DocumentIntakeProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <UploadCloud className="mt-0.5 size-5 text-primary" aria-hidden />
        <div>
          <CardTitle>PDF Intake</CardTitle>
          <CardDescription>Upload, extract, chunk, embed</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <label className="mb-4 grid min-h-32 cursor-pointer place-items-center gap-2 rounded-lg border border-dashed border-muted-foreground/45 text-muted-foreground transition-colors hover:bg-accent/40">
          <input
            className="sr-only"
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onUpload(file);
              }
              event.currentTarget.value = "";
            }}
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className="size-8 animate-spin" aria-hidden />
          ) : (
            <UploadCloud className="size-8" aria-hidden />
          )}
          <span className="text-sm font-medium">
            {isUploading ? "Indexing PDF" : "Upload PDF"}
          </span>
        </label>
        <DocumentList documents={documents} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}

function DocumentList({
  documents,
  isLoading,
}: {
  documents: DocumentDto[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Loading documents...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        No documents indexed yet.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {documents.map((document) => (
        <article
          key={document.id}
          className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border p-3"
        >
          <FileText className="mt-0.5 size-4 text-primary" aria-hidden />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium">{document.name}</h3>
              <Badge
                variant={
                  document.status === "indexed" ? "success" : "secondary"
                }
              >
                {document.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {document.pageCount} pages · {document.status}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
