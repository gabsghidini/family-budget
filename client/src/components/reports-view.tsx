import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

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

export default function ReportsView() {
  const { toast } = useToast();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`);
  
  const [year, month] = selectedMonth.split('-').map(Number);

  const { data: monthlyBalance, isLoading: balanceLoading } = useQuery<MonthlyBalance>({
    queryKey: ["/api/analytics/monthly", year, month],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  const { data: categoryExpenses = [], isLoading: categoriesLoading } = useQuery<CategoryExpense[]>({
    queryKey: ["/api/analytics/categories", year, month],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getMonthOptions = () => {
    const options = [];
    const current = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  const colors = [
    "#1976D2", "#388E3C", "#FF5722", "#9C27B0", "#FF9800",
    "#F44336", "#607D8B", "#795548", "#E91E63", "#00BCD4"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Relatórios</h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {getMonthOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="text-center p-4 rounded-xl">
                  <Skeleton className="h-8 w-24 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary/5 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-secondary mr-1" />
                </div>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(monthlyBalance?.income || 0)}
                </p>
                <p className="text-sm text-gray-600">Receitas</p>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <TrendingDown className="h-5 w-5 text-accent mr-1" />
                </div>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(monthlyBalance?.expenses || 0)}
                </p>
                <p className="text-sm text-gray-600">Despesas</p>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-primary mr-1" />
                </div>
                <p className={`text-2xl font-bold ${
                  (monthlyBalance?.balance || 0) >= 0 ? 'text-secondary' : 'text-accent'
                }`}>
                  {formatCurrency(monthlyBalance?.balance || 0)}
                </p>
                <p className="text-sm text-gray-600">Saldo</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : categoryExpenses.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Nenhuma despesa neste período</p>
              <p className="text-sm">Adicione algumas transações para ver os relatórios</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryExpenses.map((item, index) => (
                <div 
                  key={item.categoryId} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="font-medium text-gray-900">{item.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.total)}</p>
                    <p className="text-xs text-gray-500">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Taxa de Poupança</h4>
                <p className="text-blue-700">
                  {monthlyBalance?.income 
                    ? `${Math.round(((monthlyBalance.balance) / monthlyBalance.income) * 100)}%`
                    : "0%"
                  } do seu dinheiro foi poupado este mês
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Maior Categoria de Gasto</h4>
                <p className="text-green-700">
                  {categoryExpenses.length > 0 
                    ? `${categoryExpenses[0].categoryName} representa ${categoryExpenses[0].percentage}% dos seus gastos`
                    : "Nenhuma categoria de gasto registrada"
                  }
                </p>
              </div>

              {monthlyBalance && monthlyBalance.balance < 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">⚠️ Atenção</h4>
                  <p className="text-red-700">
                    Suas despesas superaram as receitas em {formatCurrency(Math.abs(monthlyBalance.balance))} este mês.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
