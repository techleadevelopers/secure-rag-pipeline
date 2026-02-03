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
      color: "text-cyan-300",
      glow: "shadow-[0_0_12px_rgba(34,211,238,0.35)]"
    },
    { 
      icon: Zap, 
      label: "Tokens", 
      value: metrics.tokens_est.toLocaleString(),
      color: "text-amber-300",
      glow: "shadow-[0_0_12px_rgba(251,191,36,0.28)]"
    },
    { 
      icon: Coins, 
      label: "Est. Cost", 
      value: `$${metrics.cost_est.toFixed(4)}`,
      color: "text-emerald-300",
      glow: "shadow-[0_0_12px_rgba(52,211,153,0.3)]"
    },
    { 
      icon: BarChart3, 
      label: "Top K", 
      value: metrics.topk,
      color: "text-indigo-300",
      glow: "shadow-[0_0_12px_rgba(129,140,248,0.32)]"
    },
    { 
      icon: FileText, 
      label: "Docs", 
      value: metrics.docs_used,
      color: "text-orange-300",
      glow: "shadow-[0_0_12px_rgba(251,146,60,0.28)]"
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/5">
      {items.map((item, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-slate-800/30 border border-white/5 text-[11px] font-semibold text-slate-100 hover:border-white/15 transition-colors cursor-help backdrop-blur-sm ${item.glow}`}
            >
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className="tracking-tight">{item.value}</span>
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
