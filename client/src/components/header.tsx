import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img 
                src="/attached_assets/LogoEmblem_1753688453831.png" 
                alt="GRiP Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-slate-900">GRiP</h1>
              <p className="text-xs text-slate-600">Generational Relief in Prosthetics</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="flex items-center gap-2"
              onClick={() => window.location.href = '/marketing-request'}
            >
              <Send className="w-4 h-4" />
              Marketing Request
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <Menu className="text-lg" />
          </Button>
        </div>
      </div>
    </header>
  );
}