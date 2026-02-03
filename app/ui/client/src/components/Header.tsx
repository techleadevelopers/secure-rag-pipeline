import { useState } from "react";
import { useRagApi } from "@/hooks/use-rag";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Key, Shield, RefreshCw, Database, Sun, Moon, Wifi, WifiOff, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { apiKey, setApiKey, role, setRole, ingest, isConnected } = useRagApi();
  const { theme, toggleTheme } = useTheme();
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);

  const handleSaveKey = () => {
    setApiKey(tempKey);
    setIsKeyDialogOpen(false);
  };

  const getConnectionStatus = () => {
    if (isConnected === null) return { icon: Circle, color: "text-muted-foreground", label: "Not checked" };
    if (isConnected) return { icon: Wifi, color: "text-cyan-500", label: "Connected" };
    return { icon: WifiOff, color: "text-red-500", label: "Disconnected" };
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <header className="sticky top-0 z-50 w-full glass-panel tech-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <img
            src="https://res.cloudinary.com/limpeja/image/upload/v1770092544/image-removebg-preview_9_qi1w8y.png"
            alt="Atlantyx logo"
            className="w-8 h-8  object-cover bg-card"
          />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent hidden md:block">
            RAG Security <span className="text-accent text-sm font-normal">Corp</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
          <div 
            className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", connectionStatus.color)}
            title={connectionStatus.label}
            data-testid="status-connection"
          >
            <ConnectionIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{connectionStatus.label}</span>
          </div>

          <div className="flex items-center gap-2 bg-background/50 dark:bg-background/50 p-1 rounded-lg border border-border/50">
            <Shield className="w-4 h-4 text-muted-foreground ml-2" />
            <Select 
              value={role} 
              onValueChange={(val: any) => setRole(val)}
            >
              <SelectTrigger 
                className="w-[100px] md:w-[130px] border-none bg-transparent h-8 focus:ring-0 text-xs md:text-sm font-medium"
                data-testid="select-role"
              >
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={cn(
                  "gap-2 transition-colors",
                  !apiKey 
                    ? "border-destructive text-destructive hover:bg-destructive/10" 
                    : "border-border/50 hover:bg-accent/10 hover:text-accent hover:border-accent/50"
                )}
                data-testid="button-api-key"
              >
                <Key className="w-4 h-4" />
                <span className="hidden md:inline">{apiKey ? "API Key Set" : "Set API Key"}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>API Configuration</DialogTitle>
                <DialogDescription>
                  Enter your X-API-Key to access the secure RAG endpoints. This is stored locally in your browser.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-16 font-mono"
                    data-testid="input-api-key"
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                    type="button"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveKey} data-testid="button-save-api-key">Save Configuration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            data-testid="button-toggle-theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={ingest.isPending || !apiKey}
                className="text-muted-foreground hover:text-accent hover:bg-accent/10"
                title="Re-index Knowledge Base"
                data-testid="button-ingest"
              >
                <RefreshCw className={cn("w-4 h-4", ingest.isPending && "animate-spin")} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Re-index Knowledge Base?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will trigger a full re-indexing of all documents. This process may take several minutes depending on the size of your knowledge base.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => ingest.mutate()} data-testid="button-confirm-ingest">
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}
