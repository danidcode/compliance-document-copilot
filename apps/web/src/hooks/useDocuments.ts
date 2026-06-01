import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listDocuments, uploadDocument } from "../api/client.js";

export const documentKeys = {
  all: ["documents"] as const,
};

export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.all,
    queryFn: listDocuments,
    select: (response) => response.documents,
    refetchInterval: (query) => {
      const documents = query.state.data?.documents ?? [];
      return documents.some(
        (document) =>
          document.status === "uploaded" || document.status === "processing",
      )
        ? 2_000
        : false;
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}
