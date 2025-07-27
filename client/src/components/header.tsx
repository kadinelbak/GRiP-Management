import { HandHeart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 grip-primary rounded-lg flex items-center justify-center">
                <HandHeart className="text-white text-lg" />
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-slate-900">GRiP</h1>
              <p className="text-xs text-slate-600">Generational Relief in Prosthetics</p>
            </div>
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
