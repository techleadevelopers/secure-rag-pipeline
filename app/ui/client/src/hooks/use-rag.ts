import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { AskPayload, AskResponse } from "@shared/schema";

export function useRagApi() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("rag_api_key") || "");
  const [role, setRole] = useState<AskPayload["user_role"]>(() => 
    (localStorage.getItem("rag_user_role") as AskPayload["user_role"]) || "public"
  );
  const [conversationId, setConversationId] = useState<string>(() => 
    localStorage.getItem("rag_conversation_id") || crypto.randomUUID()
  );
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    localStorage.setItem("rag_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem("rag_user_role", role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem("rag_conversation_id", conversationId);
  }, [conversationId]);

  const baseUrl =
    import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ||
    window.location.origin.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";

  const checkConnection = useCallback(async () => {
    if (!apiKey) {
      setIsConnected(null);
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(`${baseUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setIsConnected(res.ok || res.status === 404);
    } catch {
      setIsConnected(false);
    }
  }, [apiKey, baseUrl]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  const resetConversation = useCallback(() => {
    const newId = crypto.randomUUID();
    setConversationId(newId);
    localStorage.setItem("rag_conversation_id", newId);
    return newId;
  }, []);

  const askMutation = useMutation({
    mutationFn: async (payload: { question: string }) => {
      if (!apiKey) {
        throw new Error("API Key is required");
      }

      const fullPayload: AskPayload = {
        question: payload.question,
        user_role: role,
        conversation_id: conversationId,
      };
      
      const validatedPayload = api.rag.ask.input.parse(fullPayload);

      const res = await fetch(`${baseUrl}${api.rag.ask.path}`, {
        method: api.rag.ask.method,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(validatedPayload),
      });

      if (!res.ok) {
        setIsConnected(res.status !== 503);
        if (res.status === 401) {
          throw new Error("Unauthorized: Invalid API Key");
        }
        if (res.status === 503) {
          throw new Error("Service Unavailable: The RAG system is busy or down.");
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${res.status}: ${res.statusText}`);
      }

      setIsConnected(true);
      const data = await res.json();
      return api.rag.ask.responses[200].parse(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const ingestMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey) throw new Error("API Key is required");

      const res = await fetch(`${baseUrl}${api.rag.ingest.path}`, {
        method: api.rag.ingest.method,
        headers: {
          "X-API-Key": apiKey,
        },
      });

      if (!res.ok) {
         if (res.status === 401) throw new Error("Unauthorized");
         throw new Error("Ingestion failed");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Knowledge base re-indexed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Ingestion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    apiKey,
    setApiKey,
    role,
    setRole,
    conversationId,
    resetConversation,
    isConnected,
    checkConnection,
    ask: askMutation,
    ingest: ingestMutation,
  };
}
