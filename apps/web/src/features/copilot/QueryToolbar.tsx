import { Bot, Loader2, MessageSquareText, Search } from "lucide-react";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";

type QueryToolbarProps = {
  question: string;
  topK: number;
  disabled: boolean;
  isSearching: boolean;
  isChatting: boolean;
  isAgentRunning: boolean;
  onQuestionChange: (question: string) => void;
  onTopKChange: (topK: number) => void;
  onSearch: () => void;
  onAsk: () => void;
  onAgent: () => void;
};

export function QueryToolbar({
  question,
  topK,
  disabled,
  isSearching,
  isChatting,
  isAgentRunning,
  onQuestionChange,
  onTopKChange,
  onSearch,
  onAsk,
  onAgent,
}: QueryToolbarProps) {
  return (
    <header className="mb-4 grid items-center gap-2 lg:grid-cols-[minmax(220px,1fr)_96px_auto_auto_auto]">
      <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3">
        <MessageSquareText
          className="size-4 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="Ask a question about indexed PDFs"
        />
      </div>
      <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
        <span>Top K</span>
        <Input
          className="h-8 w-10 border-0 px-0 text-foreground shadow-none focus-visible:ring-0"
          type="number"
          min={1}
          max={20}
          value={topK}
          onChange={(event) => onTopKChange(Number(event.target.value))}
        />
      </label>
      <Button
        type="button"
        variant="outline"
        onClick={onSearch}
        disabled={disabled || isSearching || isChatting || isAgentRunning}
      >
        {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
        Search
      </Button>
      <Button
        type="button"
        onClick={onAsk}
        disabled={disabled || isSearching || isChatting || isAgentRunning}
      >
        {isChatting ? (
          <Loader2 className="animate-spin" />
        ) : (
          <MessageSquareText />
        )}
        Ask
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={onAgent}
        disabled={disabled || isSearching || isChatting || isAgentRunning}
      >
        {isAgentRunning ? <Loader2 className="animate-spin" /> : <Bot />}
        Agent
      </Button>
    </header>
  );
}
