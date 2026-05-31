import {
  ChatResponseSchema,
  DocumentsResponseSchema,
  SearchResponseSchema,
  UploadDocumentResponseSchema,
  type ChatRequest,
  type SearchRequest
} from "@cdc/contracts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export async function listDocuments() {
  const response = await fetch(`${API_BASE_URL}/api/documents`);
  assertOk(response);
  return DocumentsResponseSchema.parse(await response.json());
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/documents`, {
    method: "POST",
    body: formData
  });
  assertOk(response);
  return UploadDocumentResponseSchema.parse(await response.json());
}

export async function searchDocuments(request: SearchRequest) {
  const response = await fetch(`${API_BASE_URL}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  assertOk(response);
  return SearchResponseSchema.parse(await response.json());
}

export async function askQuestion(request: ChatRequest) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  assertOk(response);
  return ChatResponseSchema.parse(await response.json());
}

async function assertOk(response: Response) {
  if (response.ok) {
    return;
  }

  let message = `${response.status} ${response.statusText}`;
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    message = body.error?.message ?? message;
  } catch {
    // Keep the HTTP status as the fallback message.
  }
  throw new Error(message);
}
