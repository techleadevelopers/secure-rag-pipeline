import { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { MessageBubble, type Message } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { useRagApi } from "@/hooks/use-rag";
import { Database, AlertCircle, Trash2, Download, FileJson, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MESSAGES_KEY = "rag_chat_messages";

function serializeMessages(messages: Message[]): string {
  return JSON.stringify(messages.map(m => ({
    ...m,
    timestamp: m.timestamp.toISOString()
  })));
}

function deserializeMessages(str: string): Message[] {
  try {
    const parsed = JSON.parse(str);
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }));
  } catch {
    return [];
  }
}

export default function Home() {
  const { ask, apiKey, resetConversation } = useRagApi();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem(MESSAGES_KEY);
    return stored ? deserializeMessages(stored) : [];
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(MESSAGES_KEY, serializeMessages(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const genId = () =>
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const handleSendMessage = (content: string) => {
    const userMsg: Message = {
      id: genId(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    ask.mutate({ question: content }, {
      onSuccess: (data) => {
        const agentMsg: Message = {
          id: genId(),
          role: "agent",
          content: data.answer,
          data: data,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMsg]);
      },
    });
  };

  const handleClearConversation = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_KEY);
    resetConversation();
    toast({
      title: "Conversation cleared",
      description: "Started a new conversation session.",
    });
  }, [resetConversation, toast]);

  const handleExportJSON = useCallback(() => {
    const data = JSON.stringify(messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
      ...(m.data && {
        confidence: m.data.confidence,
        citations: m.data.citations,
        notes: m.data.notes,
        metrics: m.data.metrics,
      })
    })), null, 2);
    
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  const handleExportTXT = useCallback(() => {
    const text = messages.map(m => {
      const role = m.role === "user" ? "You" : "Agent";
      const time = m.timestamp.toLocaleString();
      let content = `[${time}] ${role}:\n${m.content}`;
      
      if (m.data) {
        content += `\n\nConfidence: ${Math.round(m.data.confidence * 100)}%`;
        if (m.data.citations.length > 0) {
          content += "\n\nSources:";
          m.data.citations.forEach((c, i) => {
            content += `\n  ${i + 1}. ${c.doc_id} - "${c.quote}"`;
          });
        }
      }
      
      return content;
    }).join("\n\n---\n\n");
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-accent/30">
      <Header />

      <main className="flex-1 relative flex flex-col min-h-0">
        {messages.length > 0 && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 bg-background/80 backdrop-blur-sm"
                  data-testid="button-export-chat"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportJSON} data-testid="button-export-json">
                  <FileJson className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportTXT} data-testid="button-export-txt">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as TXT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                  data-testid="button-clear-chat"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Conversation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all messages in the current conversation. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearConversation}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-clear"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-6 pb-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
                <div className="w-28 h-28  flex items-center justify-center overflow-hidden">
                  <img
                    src="https://res.cloudinary.com/limpeja/image/upload/v1770091995/image-removebg-preview_8_dcvfxk.png"
                    alt="Projects"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-2 max-w-md">
                  <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Secure Knowledge Base
                  </h2>
                  <p className="text-muted-foreground">
                    Ask questions about your internal documentation. All queries are logged and access controlled based on your role.
                  </p>
                </div>
                
                {!apiKey && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-full text-sm text-destructive animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    <span>Please configure your API Key in the top right</span>
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))
            )}
            
            {ask.isPending && (
              <div className="flex justify-start w-full max-w-4xl mx-auto">
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-card border border-border/50 shadow-lg w-fit">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-accent/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-accent/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-accent/50 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Processing query...</span>
                </div>
              </div>
            )}
            
            <div ref={scrollRef} className="h-px" />
          </div>
        </div>

        <ChatInput 
          onSend={handleSendMessage} 
          isLoading={ask.isPending} 
          disabled={!apiKey}
        />
      </main>
    </div>
  );
}
