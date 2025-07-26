import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TransactionWithCategory } from "@shared/schema";

type FilterType = "all" | "income" | "expense" | "month";

export default function TransactionsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: transactions = [], isLoading } = useQuery<TransactionWithCategory[]>({
    queryKey: ["/api/transactions"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      await apiRequest("DELETE", `/api/transactions/${transactionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso",
      });
    },
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
      toast({
        title: "Erro",
        description: "Erro ao excluir transação",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const handleDelete = (transactionId: string) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      deleteMutation.mutate(transactionId);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "all") return true;
    if (filter === "income") return transaction.type === "income";
    if (filter === "expense") return transaction.type === "expense";
    if (filter === "month") {
      const currentMonth = new Date().getMonth();
      const transactionMonth = new Date(transaction.date).getMonth();
      return currentMonth === transactionMonth;
    }
    return true;
  });

  const filterButtons = [
    { key: "all", label: "Todas" },
    { key: "income", label: "Receitas" },
    { key: "expense", label: "Despesas" },
    { key: "month", label: "Este mês" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transações</h2>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </Button>
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {filterButtons.map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <p>Nenhuma transação encontrada</p>
              <p className="text-sm">
                {filter !== "all" ? "Tente alterar os filtros" : "Adicione sua primeira transação para começar"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-secondary/10' : 'bg-accent/10'
                    }`}>
                      <i className={`fas fa-${transaction.category.icon} ${
                        transaction.type === 'income' ? 'text-secondary' : 'text-accent'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.category.name}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(transaction.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <div>
                      <p className={`font-semibold text-lg ${
                        transaction.type === 'income' ? 'text-secondary' : 'text-accent'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                      </p>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                        <Edit className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 h-8 w-8 hover:text-red-600"
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
