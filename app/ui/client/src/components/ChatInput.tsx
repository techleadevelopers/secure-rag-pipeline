import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    
    onSend(input);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full glass-panel border-t border-white/5 dark:border-white/5 p-4 md:p-6 pb-6 md:pb-8">
      <div className="max-w-4xl mx-auto relative">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-3 bg-secondary/30 dark:bg-secondary/30 rounded-xl p-2 border border-white/5 dark:border-white/5 focus-within:border-accent/50 focus-within:bg-secondary/50 transition-all duration-200 ring-offset-2 focus-within:ring-2 ring-accent/20">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Please enter your API Key to start chatting..." : "Ask a question about the documentation..."}
            className="min-h-[50px] max-h-[150px] w-full resize-none border-0 bg-transparent focus-visible:ring-0 text-base py-3"
            disabled={disabled}
            data-testid="input-chat-message"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || isLoading || disabled}
            className={`
              h-10 w-10 mb-1 shrink-0 rounded-lg transition-all duration-300
              ${(!input.trim() || isLoading || disabled) ? 'bg-muted text-muted-foreground' : 'bg-gradient-to-br from-accent to-primary shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5'}
            `}
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
        <div className="text-[10px] text-center mt-2 text-muted-foreground font-mono">
          <span className="hidden md:inline">Ctrl+Enter or </span>Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
