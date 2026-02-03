import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AskResponse } from "@shared/schema";
import { AlertTriangle, User, Bot, ShieldAlert, Copy, Check } from "lucide-react";
import { MetricsBar } from "./MetricsBar";
import { CitationsList } from "./CitationsList";
import { ConfidenceBar } from "./ConfidenceBar";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  data?: AskResponse;
  timestamp: Date;
};

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex w-full gap-4 max-w-4xl mx-auto mb-6 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-lg",
        isUser 
          ? "bg-primary/20 border-primary/50 text-primary" 
          : "bg-accent/20 border-accent/50 text-accent"
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn(
        "flex flex-col max-w-[85%] md:max-w-[75%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "relative rounded-2xl px-6 py-4 shadow-xl text-sm md:text-base leading-relaxed",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-card dark:bg-card border border-border/50 text-card-foreground rounded-tl-sm neon-glow"
        )}>
          {!isUser && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-white/10"
              data-testid="button-copy-message"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          )}

          <div className={cn(
            "prose prose-sm max-w-none",
            isUser ? "prose-invert" : "dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-accent prose-code:bg-white/10 prose-code:px-1 prose-code:rounded"
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          {message.data && (
            <div className="mt-4 pt-4 border-t border-border/50 dark:border-border/50 space-y-4">
              <ConfidenceBar confidence={message.data.confidence} />

              {message.data.confidence < 0.4 && (
                <Alert variant="destructive" className="py-2 bg-destructive/10 border-destructive/20 text-destructive-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-bold uppercase">Low Confidence</AlertTitle>
                  <AlertDescription className="text-xs opacity-90">
                    The AI is unsure about this answer. Verify with sources.
                  </AlertDescription>
                </Alert>
              )}

              {message.data.notes && message.data.notes.length > 0 && (
                <Alert className="py-2 bg-yellow-500/10 border-yellow-500/20 text-yellow-500">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle className="text-xs font-bold uppercase">Security Notices</AlertTitle>
                  <AlertDescription className="text-xs opacity-90 mt-1">
                    <ul className="list-disc pl-4 space-y-1">
                      {message.data.notes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <CitationsList citations={message.data.citations} />
              <MetricsBar metrics={message.data.metrics} />
            </div>
          )}
        </div>
        
        <span className="text-[10px] text-muted-foreground mt-2 px-1 font-mono opacity-50">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
