import { useState } from "react";
import { CheckCircle2, AlertCircle, Settings2, XCircle } from "lucide-react";
import { useSystemStatus } from "@/hooks/use-chat";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FooterControlsProps {
  liveOnly: boolean;
  setLiveOnly: (val: boolean) => void;
  model: string;
  setModel: (val: string) => void;
}

export function FooterControls({ liveOnly, setLiveOnly, model, setModel }: FooterControlsProps) {
  const { data: status, isLoading, isError } = useSystemStatus();

  return (
    <div className="border-t bg-white p-4 md:p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
      <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 text-sm">
        
        {/* Status Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 shadow-sm w-full md:w-auto justify-center">
          {isLoading ? (
            <>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
              <span className="text-muted-foreground font-medium">Checking AI status...</span>
            </>
          ) : isError ? (
             <>
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-destructive font-medium">Status Check Failed</span>
            </>
          ) : (
            <>
              {status?.gemini ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              )}
              <span className={cn(
                "font-medium",
                status?.gemini ? "text-green-700" : "text-yellow-700"
              )}>
                {status?.gemini ? "Gemini: Enabled (Live)" : "Gemini: Disabled"}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-center md:justify-end">
          {/* Live Only Toggle */}
          <div className="flex items-center gap-2">
            <Switch 
              id="live-mode" 
              checked={liveOnly}
              onCheckedChange={setLiveOnly}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="live-mode" className="cursor-pointer font-medium text-gray-600">
              Live-only mode
            </Label>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
                <SelectItem value="gemini-pro">gemini-pro</SelectItem>
                <SelectItem value="text-bison-001">text-bison-001</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>
    </div>
  );
}
