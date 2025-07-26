import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Minus, ShoppingCart, Briefcase, Car } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TransactionWithCategory } from "@shared/schema";

interface DashboardViewProps {
  onAddTransaction: (type: "income" | "expense") => void;
}

interface MonthlyBalance {
  income: number;
  expenses: number;
  balance: number;
}

interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
}

export default function DashboardView({ onAddTransaction }: DashboardViewProps) {
  const { toast } = useToast();
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: monthlyBalance, isLoading: balanceLoading } = useQuery<MonthlyBalance>({
    queryKey: ["/api/analytics/monthly", year, month],
  });

  const { data: recentTransactions = [], isLoading: transactionsLoading } = useQuery<TransactionWithCategory[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: categoryExpenses = [], isLoading: categoriesLoading } = useQuery<CategoryExpense[]>({
    queryKey: ["/api/analytics/categories", year, month],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getIconForCategory = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('alimentação') || name.includes('supermercado')) {
      return <ShoppingCart className="h-5 w-5" />;
    }
    if (name.includes('salário') || name.includes('renda')) {
      return <Briefcase className="h-5 w-5" />;
    }
    if (name.includes('transporte') || name.includes('combustível')) {
      return <Car className="h-5 w-5" />;
    }
    return <ShoppingCart className="h-5 w-5" />;
  };

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays <= 7) return `${diffInDays} dias atrás`;
    
    return format(date, "dd 'de' MMM", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Balance Overview Card */}
      <Card className="bg-gradient-to-r from-primary to-blue-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Saldo Total</h2>
          </div>
          <div className="space-y-2">
            {balanceLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20" />
            ) : (
              <p className="text-3xl font-bold">
                {formatCurrency(monthlyBalance?.balance || 0)}
              </p>
            )}
            <div className="flex items-center space-x-4 text-sm">
              {balanceLoading ? (
                <>
                  <Skeleton className="h-4 w-24 bg-white/20" />
                  <Skeleton className="h-4 w-24 bg-white/20" />
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-1">
                    <Plus className="h-4 w-4 text-green-300" />
                    <span>{formatCurrency(monthlyBalance?.income || 0)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Minus className="h-4 w-4 text-red-300" />
                    <span>{formatCurrency(monthlyBalance?.expenses || 0)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent 
            className="p-4" 
            onClick={() => onAddTransaction("income")}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-secondary/10 w-12 h-12 rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-secondary" />
              </div>
              <span className="font-medium text-gray-900">Adicionar Receita</span>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent 
            className="p-4" 
            onClick={() => onAddTransaction("expense")}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center">
                <Minus className="h-6 w-6 text-accent" />
              </div>
              <span className="font-medium text-gray-900">Adicionar Despesa</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Transações Recentes</CardTitle>
            <Button variant="link" className="text-primary p-0">Ver todas</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {transactionsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))
            ) : recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Nenhuma transação encontrada</p>
                <p className="text-sm">Adicione sua primeira transação para começar</p>
              </div>
            ) : (
              recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-secondary/10' : 'bg-accent/10'
                    }`}>
                      <div className={transaction.type === 'income' ? 'text-secondary' : 'text-accent'}>
                        {getIconForCategory(transaction.category.name)}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.category.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' ? 'text-secondary' : 'text-accent'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeDate(new Date(transaction.date))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoriesLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))
          ) : categoryExpenses.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <p>Nenhuma despesa neste mês</p>
            </div>
          ) : (
            categoryExpenses.slice(0, 5).map((category) => (
              <div key={category.categoryId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{category.categoryName}</span>
                  <span className="text-sm text-gray-600">{formatCurrency(category.total)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
