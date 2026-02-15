import { Bug } from "lucide-react";

export function Header() {
  return (
    <header className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground py-8 px-4 shadow-xl">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-3">
        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm shadow-inner ring-1 ring-white/20 mb-2">
          <Bug className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow-sm">
          PestControl AI
        </h1>
        
        <p className="text-primary-foreground/90 font-medium text-sm md:text-base max-w-md leading-relaxed">
          Intelligent Pest Identification & Prevention Advisor
        </p>
      </div>
    </header>
  );
}
