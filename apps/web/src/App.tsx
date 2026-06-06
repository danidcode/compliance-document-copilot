import { useMemo } from "react";
import { ErrorBanner } from "./components/ErrorBanner.js";
import { Sidebar } from "./components/Sidebar.js";
import { Badge } from "./components/ui/badge.js";
import { QueryToolbar } from "./features/copilot/QueryToolbar.js";
import { DocumentIntake } from "./features/documents/DocumentIntake.js";
import { ResultsPanel } from "./features/results/ResultsPanel.js";
import { useCopilotWorkspace } from "./hooks/useCopilotWorkspace.js";
import { useDocuments, useUploadDocument } from "./hooks/useDocuments.js";

export function App() {
  const documentsQuery = useDocuments();
  const uploadMutation = useUploadDocument();
  const copilot = useCopilotWorkspace();

  const documents = documentsQuery.data ?? [];
  const indexedCount = useMemo(
    () => documents.filter((document) => document.status === "indexed").length,
    [documents],
  );
  const error = documentsQuery.error ?? uploadMutation.error ?? copilot.error;

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
      <Sidebar
        activePhase={copilot.phase}
        documentCount={documents.length}
        indexedCount={indexedCount}
        onPhaseChange={copilot.setPhase}
      />

      <section className="min-w-0 p-6">
        <div className="mb-5 flex items-start justify-between gap-4 max-sm:grid">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Compliance RAG Console
            </p>
            <h2 className="text-xl font-semibold tracking-normal">
              Index PDFs and inspect grounded answers
            </h2>
          </div>
          <Badge variant={indexedCount > 0 ? "success" : "secondary"}>
            {indexedCount > 0 ? "Ready" : "Needs indexed PDFs"}
          </Badge>
        </div>

        <QueryToolbar
          question={copilot.question}
          topK={copilot.topK}
          disabled={indexedCount === 0}
          isSearching={copilot.isSearching}
          isChatting={copilot.isChatting}
          isAgentRunning={copilot.isAgentRunning}
          onQuestionChange={copilot.setQuestion}
          onTopKChange={copilot.setTopK}
          onSearch={copilot.runSearch}
          onAsk={copilot.runChat}
          onAgent={copilot.runAgent}
        />

        <ErrorBanner error={error} />

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
          <DocumentIntake
            documents={documents}
            isLoading={documentsQuery.isLoading}
            isUploading={uploadMutation.isPending}
            onUpload={(file) => uploadMutation.mutate(file)}
          />
          <ResultsPanel
            phase={copilot.phase}
            searchResult={copilot.searchResult}
            chatResult={copilot.chatResult}
          />
        </div>
      </section>
    </main>
  );
}
