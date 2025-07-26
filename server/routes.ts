import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertCategorySchema, insertTransactionSchema, insertSavingsGoalSchema, insertSpendingAlertSchema } from "@shared/schema";
import { z } from "zod";

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
      const userId = req.user.id;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(userId, categoryData);
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
      const userId = req.user.id;
      const categoryId = req.params.id;
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(userId, categoryId, categoryData);
      
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
      const userId = req.user.id;
      const categoryId = req.params.id;
      const deleted = await storage.deleteCategory(userId, categoryId);
      
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
      const userId = req.user.id;
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(userId, transactionData);
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
      const userId = req.user.id;
      const transactionId = req.params.id;
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(userId, transactionId, transactionData);
      
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
      const userId = req.user.id;
      const transactionId = req.params.id;
      const deleted = await storage.deleteTransaction(userId, transactionId);
      
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
      const userId = req.user.id;
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }
      
      const balance = await storage.getMonthlyBalance(userId, year, month);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching monthly balance:", error);
      res.status(500).json({ message: "Failed to fetch monthly balance" });
    }
  });

  app.get('/api/analytics/categories/:year/:month', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }
      
      const categoryExpenses = await storage.getCategoryExpenses(userId, year, month);
      res.json(categoryExpenses);
    } catch (error) {
      console.error("Error fetching category expenses:", error);
      res.status(500).json({ message: "Failed to fetch category expenses" });
    }
  });

  // Savings Goals routes
  app.get('/api/savings-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goals = await storage.getSavingsGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  app.post('/api/savings-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goalData = insertSavingsGoalSchema.parse(req.body);
      const goal = await storage.createSavingsGoal(userId, goalData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating savings goal:", error);
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });

  app.put('/api/savings-goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goalId = req.params.id;
      const goalData = insertSavingsGoalSchema.partial().parse(req.body);
      const goal = await storage.updateSavingsGoal(userId, goalId, goalData);
      
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
      const userId = req.user.id;
      const goalId = req.params.id;
      const deleted = await storage.deleteSavingsGoal(userId, goalId);
      
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
      const userId = req.user.id;
      const alerts = await storage.getSpendingAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching spending alerts:", error);
      res.status(500).json({ message: "Failed to fetch spending alerts" });
    }
  });

  app.post('/api/spending-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const alertData = insertSpendingAlertSchema.parse(req.body);
      const alert = await storage.createSpendingAlert(userId, alertData);
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
      const userId = req.user.id;
      const alertId = req.params.id;
      const alertData = insertSpendingAlertSchema.partial().parse(req.body);
      const alert = await storage.updateSpendingAlert(userId, alertId, alertData);
      
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
      const userId = req.user.id;
      const alertId = req.params.id;
      const deleted = await storage.deleteSpendingAlert(userId, alertId);
      
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
      const userId = req.user.id;
      const alerts = await storage.checkSpendingAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error checking spending alerts:", error);
      res.status(500).json({ message: "Failed to check spending alerts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
