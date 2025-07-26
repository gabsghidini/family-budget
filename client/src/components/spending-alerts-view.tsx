import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Plus, Calendar, DollarSign, Edit, Trash2, CheckCircle } from "lucide-react";
import type { SpendingAlertWithCategory, Category } from "@shared/schema";

const alertSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  limitAmount: z.string().min(1, "Limite é obrigatório"),
  period: z.enum(["daily", "weekly", "monthly"]),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type AlertFormData = z.infer<typeof alertSchema>;

const periodLabels = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

export default function SpendingAlertsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SpendingAlertWithCategory | null>(null);

  const form = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      name: "",
      limitAmount: "",
      period: "monthly",
      categoryId: "",
      isActive: true,
    },
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<SpendingAlertWithCategory[]>({
    queryKey: ["/api/spending-alerts"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: alertsStatus = [] } = useQuery<Array<{ alert: SpendingAlertWithCategory; currentSpending: number; percentageUsed: number }>>({
    queryKey: ["/api/spending-alerts/check"],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (data: AlertFormData) => {
      const payload = {
        ...data,
        limitAmount: parseFloat(data.limitAmount),
        categoryId: data.categoryId || null,
      };
      const res = await apiRequest("POST", "/api/spending-alerts", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spending-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spending-alerts/check"] });
      toast({
        title: "Alerta criado",
        description: "Alerta de gastos criado com sucesso!",
      });
      setIsModalOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AlertFormData }) => {
      const payload = {
        ...data,
        limitAmount: parseFloat(data.limitAmount),
        categoryId: data.categoryId || null,
      };
      const res = await apiRequest("PUT", `/api/spending-alerts/${id}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spending-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spending-alerts/check"] });
      toast({
        title: "Alerta atualizado",
        description: "Alerta de gastos atualizado com sucesso!",
      });
      setIsModalOpen(false);
      setEditingAlert(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/spending-alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spending-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spending-alerts/check"] });
      toast({
        title: "Alerta removido",
        description: "Alerta de gastos removido com sucesso!",
      });
    },
  });

  const onSubmit = (data: AlertFormData) => {
    if (editingAlert) {
      updateMutation.mutate({ id: editingAlert.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (alert: SpendingAlertWithCategory) => {
    setEditingAlert(alert);
    form.reset({
      name: alert.name,
      limitAmount: alert.limitAmount.toString(),
      period: alert.period,
      categoryId: alert.categoryId || "",
      isActive: alert.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este alerta?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getAlertStatus = (alertId: string) => {
    return alertsStatus.find(status => status.alert.id === alertId);
  };

  const getAlertColor = (percentage: number) => {
    if (percentage >= 100) return "destructive";
    if (percentage >= 80) return "warning";
    if (percentage >= 60) return "yellow";
    return "default";
  };

  if (alertsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-2 w-full mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Alertas de Gastos</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAlert(null); form.reset(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Alerta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAlert ? "Editar Alerta" : "Novo Alerta de Gastos"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Alerta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Limite de alimentação mensal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="limitAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="500.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Período</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Diário</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as categorias" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Todas as categorias</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <span className="flex items-center">
                                <i className={`fas ${category.icon} mr-2`} style={{ color: category.color }} />
                                {category.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Alerta Ativo
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Receber notificações quando o limite for atingido
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingAlert ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum alerta encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie alertas para ser notificado quando seus gastos atingirem determinados limites.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Alerta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => {
            const status = getAlertStatus(alert.id);
            const percentage = status?.percentageUsed || 0;
            const currentSpending = status?.currentSpending || 0;
            
            return (
              <Card key={alert.id} className={`relative ${!alert.isActive ? "opacity-60" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{alert.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {!alert.isActive && <Badge variant="secondary">Inativo</Badge>}
                        <Badge variant={getAlertColor(percentage)}>
                          {percentage >= 100 ? (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          ) : percentage >= 80 ? (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {periodLabels[alert.period]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(alert)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{formatCurrency(currentSpending)}</span>
                        <span>{formatCurrency(Number(alert.limitAmount))}</span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className={`h-2 ${percentage >= 100 ? 'bg-red-100' : percentage >= 80 ? 'bg-yellow-100' : 'bg-green-100'}`}
                      />
                      <div className="text-center text-sm text-muted-foreground mt-1">
                        {percentage.toFixed(1)}% do limite usado
                      </div>
                    </div>
                    
                    {alert.category && (
                      <div className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center">
                          <i className={`fas ${alert.category.icon} mr-2`} style={{ color: alert.category.color }} />
                          {alert.category.name}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      {percentage >= 100 ? (
                        <span className="text-red-600 font-medium">
                          Limite excedido em {formatCurrency(currentSpending - Number(alert.limitAmount))}
                        </span>
                      ) : (
                        <span>
                          Restam {formatCurrency(Number(alert.limitAmount) - currentSpending)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}