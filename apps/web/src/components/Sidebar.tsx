import type { Phase } from "../types.js";
import { Button } from "./ui/button.js";

type SidebarProps = {
  activePhase: Phase;
  documentCount: number;
  indexedCount: number;
  onPhaseChange: (phase: Phase) => void;
};

const phases: Array<{ phase: Phase; label: string }> = [
  { phase: "upload", label: "1 Upload" },
  { phase: "search", label: "2 Search" },
  { phase: "chat", label: "3 RAG Chat" },
  { phase: "agent", label: "4 Agent" },
  { phase: "evaluate", label: "5 Eval" },
];

export function Sidebar({
  activePhase,
  documentCount,
  indexedCount,
  onPhaseChange,
}: SidebarProps) {
  return (
    <aside className="flex flex-col gap-7 bg-[#16251f] p-7 text-white">
      <div>
        <p className="mb-2 text-xs font-bold uppercase text-emerald-200">
          AI Engineering Project
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-normal">
          Compliance Document Copilot
        </h1>
      </div>

      <nav className="grid gap-2" aria-label="Project phases">
        {phases.map((item) => (
          <Button
            key={item.phase}
            type="button"
            variant={item.phase === activePhase ? "secondary" : "ghost"}
            className={
              item.phase === activePhase
                ? "justify-start bg-emerald-50 text-[#16251f] hover:bg-emerald-50"
                : "justify-start border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            }
            onClick={() => onPhaseChange(item.phase)}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      <section className="grid grid-cols-2 gap-3" aria-label="Index status">
        <div className="rounded-lg border border-white/15 p-3">
          <span className="text-3xl font-bold">{documentCount}</span>
          <p className="mt-1 text-sm text-emerald-100/75">Documents</p>
        </div>
        <div className="rounded-lg border border-white/15 p-3">
          <span className="text-3xl font-bold">{indexedCount}</span>
          <p className="mt-1 text-sm text-emerald-100/75">Indexed</p>
        </div>
      </section>
    </aside>
  );
}
