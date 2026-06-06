import { useState } from "react";
import type {
  AgentChatResponse,
  ChatResponse,
  SearchResponse,
} from "@cdc/contracts";
import { useMutation } from "@tanstack/react-query";
import { askAgent, askQuestion, searchDocuments } from "../api/client.js";
import type { Phase } from "../types.js";

export function useCopilotWorkspace() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [question, setQuestion] = useState(
    "What compliance obligations are described?",
  );
  const [topK, setTopK] = useState(6);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [chatResult, setChatResult] = useState<
    ChatResponse | AgentChatResponse | null
  >(null);

  const searchMutation = useMutation({
    mutationFn: searchDocuments,
    onMutate: () => {
      setSearchResult(null);
      setChatResult(null);
    },
    onSuccess: (response) => {
      setSearchResult(response);
      setPhase("search");
    },
  });

  const chatMutation = useMutation({
    mutationFn: askQuestion,
    onMutate: () => {
      setChatResult(null);
    },
    onSuccess: (response) => {
      setChatResult(response);
      setPhase("chat");
    },
  });

  const agentMutation = useMutation({
    mutationFn: askAgent,
    onMutate: () => {
      setSearchResult(null);
      setChatResult(null);
    },
    onSuccess: (response) => {
      setChatResult(response);
      setPhase("agent");
    },
  });

  const runSearch = () => {
    searchMutation.mutate({ question, topK });
  };

  const runChat = () => {
    chatMutation.mutate({ question, topK, temperature: 0.1 });
  };

  const runAgent = () => {
    agentMutation.mutate({ question, topK, temperature: 0.1 });
  };

  return {
    phase,
    setPhase,
    question,
    setQuestion,
    topK,
    setTopK,
    searchResult,
    chatResult,
    runSearch,
    runChat,
    runAgent,
    isSearching: searchMutation.isPending,
    isChatting: chatMutation.isPending,
    isAgentRunning: agentMutation.isPending,
    error: searchMutation.error ?? chatMutation.error ?? agentMutation.error,
  };
}
