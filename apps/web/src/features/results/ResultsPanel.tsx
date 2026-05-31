import type { ChatResponse, SearchResponse } from "@cdc/contracts";
import { Search } from "lucide-react";
import { Badge } from "../../components/ui/badge.js";
import { Card, CardContent } from "../../components/ui/card.js";
import type { Phase } from "../../types.js";

type ResultsPanelProps = {
  phase: Phase;
  searchResult: SearchResponse | null;
  chatResult: ChatResponse | null;
};

export function ResultsPanel({
  phase,
  searchResult,
  chatResult,
}: ResultsPanelProps) {
  return (
    <Card className="min-h-[520px]">
      <CardContent className="p-5">
        {phase === "chat" && chatResult ? (
          <AnswerView result={chatResult} />
        ) : null}
        {phase !== "chat" && searchResult ? (
          <SearchView result={searchResult} />
        ) : null}
        {!chatResult && !searchResult ? <EmptyState /> : null}
      </CardContent>
    </Card>
  );
}

function AnswerView({ result }: { result: ChatResponse }) {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Phase 3
          </p>
          <h2 className="text-base font-semibold">Grounded Answer</h2>
        </div>
        <Badge variant="secondary">{result.citations.length} sources</Badge>
      </div>
      <p className="whitespace-pre-wrap rounded-lg border bg-muted/35 p-4 leading-7">
        {result.answer}
      </p>
      <h3 className="mb-3 mt-5 text-sm font-semibold">Sources</h3>
      <div className="grid gap-2">
        {result.citations.map((citation) => (
          <article
            key={citation.chunkId}
            className="grid gap-2 rounded-lg border p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm">{citation.documentName}</strong>
              <span className="text-sm text-muted-foreground">
                page{" "}
                {citation.pageStart === citation.pageEnd
                  ? citation.pageStart
                  : `${citation.pageStart}-${citation.pageEnd}`}
              </span>
            </div>
            <code className="break-all text-xs text-muted-foreground">
              {citation.chunkId}
            </code>
          </article>
        ))}
      </div>
    </div>
  );
}

function SearchView({ result }: { result: SearchResponse }) {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Phase 2
          </p>
          <h2 className="text-base font-semibold">Vector Matches</h2>
        </div>
        <Badge variant="secondary">{result.matches.length} chunks</Badge>
      </div>
      <div className="grid gap-2">
        {result.matches.map((match) => (
          <article key={match.id} className="rounded-lg border p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <strong className="text-sm">{match.documentName}</strong>
              <Badge variant="outline">page {match.pageStart}</Badge>
              <Badge variant="secondary">
                {Math.round((match.similarity ?? 0) * 100)}%
              </Badge>
            </div>
            <p className="mb-3 text-sm leading-6 text-muted-foreground">
              {match.content}
            </p>
            <code className="break-all text-xs text-muted-foreground">
              {match.id}
            </code>
          </article>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-[450px] place-items-center content-center gap-3 text-center text-muted-foreground">
      <Search className="size-10" aria-hidden />
      <h2 className="text-lg font-semibold text-foreground">
        Ask or search indexed compliance PDFs
      </h2>
      <p className="max-w-md text-sm">
        Results will show retrieved chunks, page references, document names, and
        citation ids.
      </p>
    </div>
  );
}
