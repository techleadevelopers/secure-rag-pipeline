import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AskResponse } from "@shared/schema";
import { AlertTriangle, User, Bot, ShieldAlert, Copy, Check, Info } from "lucide-react";
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
  const confidence = message.data?.confidence ?? null;
  const riskColor =
    confidence === null
      ? "from-slate-600/60 to-slate-700/60 text-slate-200"
      : confidence >= 0.7
        ? "from-emerald-500/30 to-emerald-600/20 text-emerald-200"
        : confidence >= 0.4
          ? "from-amber-500/30 to-amber-600/20 text-amber-200"
          : "from-red-500/35 to-red-600/20 text-red-200";
  const riskLabel =
    confidence === null
      ? "N/A"
      : confidence >= 0.7
        ? "Risco Baixo"
        : confidence >= 0.4
          ? "Risco Moderado"
          : "Risco Alto";

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
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${riskColor} border border-white/5 shadow-lg shadow-black/20`}>
                  <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                  <span className="text-xs font-semibold tracking-tight uppercase">{riskLabel}</span>
                  {confidence !== null && (
                    <span className="text-[11px] text-white/80">({Math.round(confidence * 100)}%)</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] gap-1 bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                  onClick={() => alert("Explicação: resposta montada a partir dos trechos citados. Consulte as citações para ver a origem exata.")}
                >
                  <Info className="w-3.5 h-3.5" /> Por que essa resposta?
                </Button>
              </div>

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
