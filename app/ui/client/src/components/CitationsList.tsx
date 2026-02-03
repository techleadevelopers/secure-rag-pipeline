import { useState } from "react";
import type { Citation } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CitationsListProps {
  citations: Citation[];
}

export function CitationsList({ citations }: CitationsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations.length) return null;

  return (
    <div className="mt-4 space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 py-1 h-auto text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/5"
        data-testid="button-toggle-citations"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3" />
          <span>Sources ({citations.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <ScrollArea className="h-[120px] w-full rounded-md border border-white/5 dark:border-white/5 bg-background/20 p-2">
          <div className="space-y-2">
            {citations.map((cite, i) => (
              <div 
                key={i} 
                className="group relative pl-3 border-l-2 border-accent/30 hover:border-accent transition-colors"
                data-testid={`citation-item-${i}`}
              >
                <div className="flex items-baseline justify-between mb-1 gap-2">
                  <span className="text-xs font-medium text-accent font-mono truncate max-w-[150px]">
                    {cite.doc_id}
                  </span>
                  {cite.loc && (
                    <span className="text-[10px] text-muted-foreground font-mono bg-white/5 dark:bg-white/5 px-1 rounded shrink-0">
                      {cite.loc}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors italic">
                  "{cite.quote}"
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
