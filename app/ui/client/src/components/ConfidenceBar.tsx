import { cn } from "@/lib/utils";

interface ConfidenceBarProps {
  confidence: number;
}

export function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100);
  
  const getColor = () => {
    if (confidence >= 0.7) return "bg-green-500";
    if (confidence >= 0.4) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getLabel = () => {
    if (confidence >= 0.7) return "High";
    if (confidence >= 0.4) return "Medium";
    return "Low";
  };

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-muted-foreground font-medium shrink-0">Confidence:</span>
      <div className="flex-1 h-2 bg-white/10 dark:bg-white/10 rounded-full overflow-hidden min-w-[80px] max-w-[150px]">
        <div
          className={cn("h-full transition-all duration-500 rounded-full", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn(
        "font-mono font-bold shrink-0",
        confidence >= 0.7 && "text-green-500",
        confidence >= 0.4 && confidence < 0.7 && "text-yellow-500",
        confidence < 0.4 && "text-red-500"
      )}>
        {percentage}% ({getLabel()})
      </span>
    </div>
  );
}
