import type { Metrics } from "@shared/schema";
import { Zap, Coins, Clock, FileText, BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricsBarProps {
  metrics: Metrics;
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  const items = [
    { 
      icon: Clock, 
      label: "Latency", 
      value: `${metrics.latency_ms.toFixed(0)}ms`,
      color: "text-blue-400"
    },
    { 
      icon: Zap, 
      label: "Tokens", 
      value: metrics.tokens_est.toLocaleString(),
      color: "text-yellow-400" 
    },
    { 
      icon: Coins, 
      label: "Est. Cost", 
      value: `$${metrics.cost_est.toFixed(4)}`,
      color: "text-green-400"
    },
    { 
      icon: BarChart3, 
      label: "Top K", 
      value: metrics.topk,
      color: "text-purple-400"
    },
    { 
      icon: FileText, 
      label: "Docs", 
      value: metrics.docs_used,
      color: "text-orange-400"
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/5">
      {items.map((item, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/40 border border-white/5 text-xs font-medium text-muted-foreground hover:bg-background/60 hover:border-white/10 transition-colors cursor-help">
              <item.icon className={`w-3 h-3 ${item.color}`} />
              <span>{item.value}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-xs bg-popover border-border">
            {item.label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
