import { useEffect, useMemo, useState } from "react";
import type { ChatResponse, DocumentDto, SearchResponse } from "@cdc/contracts";
import { FileText, Loader2, MessageSquareText, Search, UploadCloud } from "lucide-react";
import { askQuestion, listDocuments, searchDocuments, uploadDocument } from "./api/client.js";

type Phase = "upload" | "search" | "chat" | "evaluate";

export function App() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [question, setQuestion] = useState("What compliance obligations are described?");
  const [topK, setTopK] = useState(6);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [chatResult, setChatResult] = useState<ChatResponse | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshDocuments().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Could not load documents");
    });
  }, []);

  const indexedCount = useMemo(
    () => documents.filter((document) => document.status === "indexed").length,
    [documents]
  );

  async function refreshDocuments() {
    const response = await listDocuments();
    setDocuments(response.documents);
  }

  async function handleUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    setIsBusy(true);
    setError(null);
    try {
      await uploadDocument(file);
      await refreshDocuments();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSearch() {
    setIsBusy(true);
    setError(null);
    setSearchResult(null);
    try {
      const response = await searchDocuments({ question, topK });
      setSearchResult(response);
      setPhase("search");
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAsk() {
    setIsBusy(true);
    setError(null);
    setChatResult(null);
    try {
      const response = await askQuestion({ question, topK, temperature: 0.1 });
      setChatResult(response);
      setPhase("chat");
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Chat failed");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">AI Engineering Project</p>
          <h1>Compliance Document Copilot</h1>
        </div>

        <nav className="phase-nav" aria-label="Project phases">
          <PhaseButton phase="upload" activePhase={phase} onClick={setPhase} label="1 Upload" />
          <PhaseButton phase="search" activePhase={phase} onClick={setPhase} label="2 Search" />
          <PhaseButton phase="chat" activePhase={phase} onClick={setPhase} label="3 RAG Chat" />
          <PhaseButton phase="evaluate" activePhase={phase} onClick={setPhase} label="4 Eval" />
        </nav>

        <section className="stat-grid" aria-label="Index status">
          <div>
            <span>{documents.length}</span>
            <p>Documents</p>
          </div>
          <div>
            <span>{indexedCount}</span>
            <p>Indexed</p>
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="toolbar">
          <div className="question-box">
            <MessageSquareText size={18} aria-hidden />
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question about indexed PDFs"
            />
          </div>
          <label className="topk-control">
            Top K
            <input
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(event) => setTopK(Number(event.target.value))}
            />
          </label>
          <button type="button" onClick={handleSearch} disabled={isBusy || indexedCount === 0}>
            {isBusy ? <Loader2 className="spin" size={17} /> : <Search size={17} />}
            Search
          </button>
          <button type="button" className="primary" onClick={handleAsk} disabled={isBusy || indexedCount === 0}>
            {isBusy ? <Loader2 className="spin" size={17} /> : <MessageSquareText size={17} />}
            Ask
          </button>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        <div className="content-grid">
          <section className="panel upload-panel">
            <div className="panel-heading">
              <UploadCloud size={20} aria-hidden />
              <h2>PDF Intake</h2>
            </div>
            <label className="drop-zone">
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => void handleUpload(event.target.files?.[0])}
                disabled={isBusy}
              />
              <UploadCloud size={32} aria-hidden />
              <span>Upload PDF</span>
            </label>
            <DocumentList documents={documents} />
          </section>

          <section className="panel result-panel">
            {phase === "chat" && chatResult ? <AnswerView result={chatResult} /> : null}
            {phase !== "chat" && searchResult ? <SearchView result={searchResult} /> : null}
            {!chatResult && !searchResult ? <EmptyState /> : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function PhaseButton(props: {
  phase: Phase;
  activePhase: Phase;
  label: string;
  onClick: (phase: Phase) => void;
}) {
  return (
    <button
      type="button"
      className={props.phase === props.activePhase ? "active" : ""}
      onClick={() => props.onClick(props.phase)}
    >
      {props.label}
    </button>
  );
}

function DocumentList({ documents }: { documents: DocumentDto[] }) {
  return (
    <div className="document-list">
      {documents.map((document) => (
        <article key={document.id} className="document-row">
          <FileText size={18} aria-hidden />
          <div>
            <h3>{document.name}</h3>
            <p>
              {document.pageCount} pages · {document.status}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function AnswerView({ result }: { result: ChatResponse }) {
  return (
    <div className="answer-view">
      <h2>Grounded Answer</h2>
      <p className="answer-text">{result.answer}</p>
      <h3>Sources</h3>
      <div className="source-list">
        {result.citations.map((citation) => (
          <article key={citation.chunkId} className="source-row">
            <strong>{citation.documentName}</strong>
            <span>
              page {citation.pageStart === citation.pageEnd ? citation.pageStart : `${citation.pageStart}-${citation.pageEnd}`}
            </span>
            <code>{citation.chunkId}</code>
          </article>
        ))}
      </div>
    </div>
  );
}

function SearchView({ result }: { result: SearchResponse }) {
  return (
    <div className="search-view">
      <h2>Vector Matches</h2>
      <div className="source-list">
        {result.matches.map((match) => (
          <article key={match.id} className="match-row">
            <div className="match-meta">
              <strong>{match.documentName}</strong>
              <span>page {match.pageStart}</span>
              <span>{Math.round((match.similarity ?? 0) * 100)}%</span>
            </div>
            <p>{match.content}</p>
            <code>{match.id}</code>
          </article>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <Search size={40} aria-hidden />
      <h2>Ask or search indexed compliance PDFs</h2>
      <p>Results will show retrieved chunks, page references, document names, and citation ids.</p>
    </div>
  );
}
