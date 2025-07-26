interface BottomNavigationProps {
  activeView: string;
  onViewChange: (view: "dashboard" | "transactions" | "categories" | "reports") => void;
}

import { Home, List, Tags, BarChart3 } from "lucide-react";
import { Button } from "./button";

export default function BottomNavigation({ activeView, onViewChange }: BottomNavigationProps) {
  const navItems = [
    { key: "dashboard", label: "Início", icon: Home },
    { key: "transactions", label: "Histórico", icon: List },
    { key: "categories", label: "Categorias", icon: Tags },
    { key: "reports", label: "Relatórios", icon: BarChart3 },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex items-center justify-around">
        {navItems.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant="ghost"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg h-auto ${
              activeView === key 
                ? "bg-primary/10 text-primary" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => onViewChange(key)}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
