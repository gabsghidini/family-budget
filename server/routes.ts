import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertCategorySchema, insertTransactionSchema, insertSavingsGoalSchema, insertSpendingAlertSchema, users, familyGroupInvites, familyGroups } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes are handled in auth.ts

  // Category routes
  app.get('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const familyGroupId = req.user.familyGroupId;
      const categories = await storage.getCategories(familyGroupId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const familyGroupId = req.user.familyGroupId;
      const userId = req.user.id;
      const category = await storage.createCategory(familyGroupId, userId, categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const categoryId = req.params.id;
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const familyGroupId = req.user.familyGroupId;
      const category = await storage.updateCategory(familyGroupId, categoryId, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const categoryId = req.params.id;
      const familyGroupId = req.user.familyGroupId;
      const deleted = await storage.deleteCategory(familyGroupId, categoryId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const familyGroupId = req.user.familyGroupId;
      const transactions = await storage.getTransactions(familyGroupId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const familyGroupId = req.user.familyGroupId;
      const userId = req.user.id;
      const transaction = await storage.createTransaction(familyGroupId, userId, transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.put('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const transactionId = req.params.id;
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      const familyGroupId = req.user.familyGroupId;
      const transaction = await storage.updateTransaction(familyGroupId, transactionId, transactionData);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const transactionId = req.params.id;
      const familyGroupId = req.user.familyGroupId;
      const deleted = await storage.deleteTransaction(familyGroupId, transactionId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/monthly/:year/:month', isAuthenticated, async (req: any, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }
      
      const familyGroupId = req.user.familyGroupId;
      const balance = await storage.getMonthlyBalance(familyGroupId, year, month);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching monthly balance:", error);
      res.status(500).json({ message: "Failed to fetch monthly balance" });
    }
  });

  app.get('/api/analytics/categories/:year/:month', isAuthenticated, async (req: any, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }
      
      const familyGroupId = req.user.familyGroupId;
      const categoryExpenses = await storage.getCategoryExpenses(familyGroupId, year, month);
      res.json(categoryExpenses);
    } catch (error) {
      console.error("Error fetching category expenses:", error);
      res.status(500).json({ message: "Failed to fetch category expenses" });
    }
  });

  // Savings Goals routes
  app.get('/api/savings-goals', isAuthenticated, async (req: any, res) => {
    try {
      const familyGroupId = req.user.familyGroupId;
      const goals = await storage.getSavingsGoals(familyGroupId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  app.post('/api/savings-goals', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Received savings goal data:", JSON.stringify(req.body, null, 2));
      const goalData = insertSavingsGoalSchema.parse(req.body);
      const familyGroupId = req.user.familyGroupId;
      const userId = req.user.id;
      const goal = await storage.createSavingsGoal(familyGroupId, userId, goalData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Zod validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating savings goal:", error);
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });

  app.put('/api/savings-goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const goalId = req.params.id;
      const goalData = insertSavingsGoalSchema.partial().parse(req.body);
      const familyGroupId = req.user.familyGroupId;
      const goal = await storage.updateSavingsGoal(familyGroupId, goalId, goalData);
      
      if (!goal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating savings goal:", error);
      res.status(500).json({ message: "Failed to update savings goal" });
    }
  });

  app.delete('/api/savings-goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const goalId = req.params.id;
      const familyGroupId = req.user.familyGroupId;
      const deleted = await storage.deleteSavingsGoal(familyGroupId, goalId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting savings goal:", error);
      res.status(500).json({ message: "Failed to delete savings goal" });
    }
  });

  // Spending Alerts routes
  app.get('/api/spending-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const familyGroupId = req.user.familyGroupId;
      const alerts = await storage.getSpendingAlerts(familyGroupId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching spending alerts:", error);
      res.status(500).json({ message: "Failed to fetch spending alerts" });
    }
  });

  app.post('/api/spending-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const alertData = insertSpendingAlertSchema.parse(req.body);
      const familyGroupId = req.user.familyGroupId;
      const userId = req.user.id;
      const alert = await storage.createSpendingAlert(familyGroupId, userId, alertData);
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating spending alert:", error);
      res.status(500).json({ message: "Failed to create spending alert" });
    }
  });

  app.put('/api/spending-alerts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const alertId = req.params.id;
      const alertData = insertSpendingAlertSchema.partial().parse(req.body);
      const familyGroupId = req.user.familyGroupId;
      const alert = await storage.updateSpendingAlert(familyGroupId, alertId, alertData);
      
      if (!alert) {
        return res.status(404).json({ message: "Spending alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating spending alert:", error);
      res.status(500).json({ message: "Failed to update spending alert" });
    }
  });

  app.delete('/api/spending-alerts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const alertId = req.params.id;
      const familyGroupId = req.user.familyGroupId;
      const deleted = await storage.deleteSpendingAlert(familyGroupId, alertId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Spending alert not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting spending alert:", error);
      res.status(500).json({ message: "Failed to delete spending alert" });
    }
  });

  // Check spending alerts endpoint
  app.get('/api/spending-alerts/check', isAuthenticated, async (req: any, res) => {
    try {
      const familyGroupId = req.user.familyGroupId;
      const alerts = await storage.checkSpendingAlerts(familyGroupId);
      res.json(alerts);
    } catch (error) {
      console.error("Error checking spending alerts:", error);
      res.status(500).json({ message: "Failed to check spending alerts" });
    }
  });

  // Family Groups routes
  app.get('/api/family-groups', isAuthenticated, async (req: any, res) => {
    try {
      const groups = await db.select().from(familyGroups);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar núcleos familiares" });
    }
  });

  app.get('/api/family-groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const groupId = req.params.id;
      const [group] = await db.select().from(familyGroups).where(eq(familyGroups.id, groupId));
      if (!group) return res.status(404).json({ message: "Núcleo não encontrado" });
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar núcleo" });
    }
  });

  app.post('/api/family-groups', isAuthenticated, async (req: any, res) => {
    try {
      const { name } = req.body;
      const userId = req.user.id;
      const [group] = await db.insert(familyGroups).values({ name }).returning();
      // Adiciona o usuário ao núcleo
      await db.update(users).set({ familyGroupId: group.id }).where(eq(users.id, userId));
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar núcleo familiar" });
    }
  });

  app.post('/api/family-groups/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const groupId = req.params.id;
      const userId = req.user.id;
      await db.update(users).set({ familyGroupId: groupId }).where(eq(users.id, userId));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao entrar no núcleo familiar" });
    }
  });

  app.post('/api/family-groups/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await db.update(users).set({ familyGroupId: null }).where(eq(users.id, userId));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao sair do núcleo familiar" });
    }
  });

  app.get('/api/family-groups/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const groupId = req.params.id;
      const members = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email
      }).from(users).where(eq(users.familyGroupId, groupId));
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar membros do núcleo" });
    }
  });

  // Family Group Invites routes
  app.post('/api/family-groups/:groupId/invite', isAuthenticated, async (req: any, res) => {
    try {
      const { email } = req.body;
      const groupId = req.params.groupId;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      // Verifica se usuário existe
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
      
      // Verifica se convite já existe
      const [existingInvite] = await db.select().from(familyGroupInvites)
        .where(and(
          eq(familyGroupInvites.familyGroupId, groupId),
          eq(familyGroupInvites.invitedUserId, user.id),
          eq(familyGroupInvites.status, "pending")
        ));
      
      if (existingInvite) {
        return res.status(400).json({ message: "Convite já foi enviado para este usuário" });
      }
      
      // Cria convite pendente
      const [invite] = await db.insert(familyGroupInvites).values({
        familyGroupId: groupId,
        invitedUserId: user.id,
        invitedEmail: email,
        status: "pending"
      }).returning();
      
      res.status(201).json(invite);
    } catch (error) {
      console.error('Error sending invite:', error);
      res.status(500).json({ message: "Erro ao enviar convite" });
    }
  });

  app.get('/api/family-group-invites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invites = await db.select().from(familyGroupInvites).where(and(eq(familyGroupInvites.invitedUserId, userId), eq(familyGroupInvites.status, "pending")));
      res.json(invites);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar convites" });
    }
  });

  app.post('/api/family-group-invites/:inviteId/accept', isAuthenticated, async (req: any, res) => {
    try {
      const inviteId = req.params.inviteId;
      const userId = req.user.id;
      // Atualiza status do convite
      await db.update(familyGroupInvites).set({ status: "accepted" }).where(and(eq(familyGroupInvites.id, inviteId), eq(familyGroupInvites.invitedUserId, userId)));
      // Atualiza núcleo do usuário
      const [invite] = await db.select().from(familyGroupInvites).where(eq(familyGroupInvites.id, inviteId));
      if (invite) {
        await db.update(users).set({ familyGroupId: invite.familyGroupId }).where(eq(users.id, userId));
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao aceitar convite" });
    }
  });

  app.post('/api/family-group-invites/:inviteId/reject', isAuthenticated, async (req: any, res) => {
    try {
      const inviteId = req.params.inviteId;
      const userId = req.user.id;
      await db.update(familyGroupInvites).set({ status: "rejected" }).where(and(eq(familyGroupInvites.id, inviteId), eq(familyGroupInvites.invitedUserId, userId)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao recusar convite" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
