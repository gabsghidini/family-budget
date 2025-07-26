import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import DashboardView from "@/components/dashboard-view";
import TransactionsView from "@/components/transactions-view";
import CategoriesView from "@/components/categories-view";
import ReportsView from "@/components/reports-view";
import BottomNavigation from "@/components/ui/bottom-navigation";
import AddTransactionModal from "@/components/ui/add-transaction-modal";
import { Button } from "@/components/ui/button";
import { Bell, Settings, Wallet } from "lucide-react";

type ViewType = "dashboard" | "transactions" | "categories" | "reports";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("expense");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const openAddModal = (type: "income" | "expense") => {
    setModalType(type);
    setIsAddModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">
                  {user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : 'Budget Familiar'}
                </h1>
                <p className="text-sm text-gray-500">Budget Familiar</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-5 w-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2" onClick={handleLogout}>
                <Settings className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {activeView === "dashboard" && <DashboardView onAddTransaction={openAddModal} />}
        {activeView === "transactions" && <TransactionsView />}
        {activeView === "categories" && <CategoriesView />}
        {activeView === "reports" && <ReportsView />}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeView={activeView} onViewChange={setActiveView} />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        type={modalType}
        onTypeChange={setModalType}
      />
    </div>
  );
}
