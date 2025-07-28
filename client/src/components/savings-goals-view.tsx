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
import { Input } from "@/components/ui/input";

import { Switch } from "@/components/ui/switch";
import { Plus, Target, Calendar, TrendingUp, Edit, Trash2 } from "lucide-react";
import type { SavingsGoal } from "@shared/schema";

const goalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  targetAmount: z.string().min(1, "Valor meta é obrigatório"),
  currentAmount: z.string().optional(),
  targetDate: z.string().optional(),
  isActive: z.boolean().default(true),
});

type GoalFormData = z.infer<typeof goalSchema>;

export default function SavingsGoalsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      targetAmount: "",
      currentAmount: "0",
      targetDate: "",
      isActive: true,
    },
  });

  const { data: goals = [], isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["/api/savings-goals"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const payload = {
        name: data.name,
        targetAmount: parseFloat(data.targetAmount),
        currentAmount: data.currentAmount ? parseFloat(data.currentAmount) : 0,
        isActive: data.isActive ?? true,
      };
      const res = await apiRequest("POST", "/api/savings-goals", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({
        title: "Meta criada",
        description: "Meta de economia criada com sucesso!",
      });
      setIsModalOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GoalFormData }) => {
      const payload = {
        ...data,
        targetAmount: parseFloat(data.targetAmount),
        currentAmount: data.currentAmount ? parseFloat(data.currentAmount) : 0,
        targetDate: data.targetDate && data.targetDate.trim() !== "" ? new Date(data.targetDate).getTime() : null,
      };
      const res = await apiRequest("PUT", `/api/savings-goals/${id}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({
        title: "Meta atualizada",
        description: "Meta de economia atualizada com sucesso!",
      });
      setIsModalOpen(false);
      setEditingGoal(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/savings-goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({
        title: "Meta removida",
        description: "Meta de economia removida com sucesso!",
      });
    },
  });

  const onSubmit = (data: GoalFormData) => {
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    form.reset({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : "",
      isActive: goal.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta meta?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Sem prazo";
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (targetDate: string | null) => {
    if (!targetDate) return null;
    const days = Math.ceil((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isLoading) {
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
        <h2 className="text-2xl font-bold">Metas de Economia</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingGoal(null); form.reset(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Editar Meta" : "Nova Meta de Economia"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Meta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Viagem para Europa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Meta (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="5000.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Atual (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Meta (opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
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
                          Meta Ativa
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Meta aparece no dashboard e relatórios
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
                    {editingGoal ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma meta encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie sua primeira meta de economia para começar a acompanhar seus objetivos financeiros.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = getProgress(Number(goal.currentAmount), Number(goal.targetAmount));
            const daysRemaining = getDaysRemaining(goal.targetDate);
            
            return (
              <Card key={goal.id} className={`relative ${!goal.isActive ? "opacity-60" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {!goal.isActive && <Badge variant="secondary">Inativa</Badge>}
                        {daysRemaining !== null && (
                          <Badge variant={daysRemaining > 30 ? "default" : "destructive"}>
                            <Calendar className="h-3 w-3 mr-1" />
                            {daysRemaining > 0 ? `${daysRemaining} dias` : "Vencida"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(goal.id)}
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
                        <span>{formatCurrency(Number(goal.currentAmount))}</span>
                        <span>{formatCurrency(Number(goal.targetAmount))}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="text-center text-sm text-muted-foreground mt-1">
                        {progress.toFixed(1)}% alcançado
                      </div>
                    </div>
                    
                    {goal.targetDate && (
                      <div className="text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Meta para {formatDate(goal.targetDate)}
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 inline mr-1" />
                      Faltam {formatCurrency(Number(goal.targetAmount) - Number(goal.currentAmount))}
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