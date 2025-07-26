import {
  users,
  categories,
  transactions,
  savingsGoals,
  spendingAlerts,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type TransactionWithCategory,
  type SavingsGoal,
  type InsertSavingsGoal,
  type SpendingAlert,
  type InsertSpendingAlert,
  type SpendingAlertWithCategory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sum, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  createCategory(userId: string, category: InsertCategory): Promise<Category>;
  updateCategory(userId: string, categoryId: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(userId: string, categoryId: string): Promise<boolean>;
  
  // Transaction operations
  getTransactions(userId: string): Promise<TransactionWithCategory[]>;
  createTransaction(userId: string, transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(userId: string, transactionId: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(userId: string, transactionId: string): Promise<boolean>;
  
  // Analytics
  getMonthlyBalance(userId: string, year: number, month: number): Promise<{ income: number; expenses: number; balance: number }>;
  getCategoryExpenses(userId: string, year: number, month: number): Promise<Array<{ categoryId: string; categoryName: string; total: number; percentage: number }>>;
  
  // Savings Goals operations
  getSavingsGoals(userId: string): Promise<SavingsGoal[]>;
  createSavingsGoal(userId: string, goal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal(userId: string, goalId: string, goal: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined>;
  deleteSavingsGoal(userId: string, goalId: string): Promise<boolean>;
  
  // Spending Alerts operations
  getSpendingAlerts(userId: string): Promise<SpendingAlertWithCategory[]>;
  createSpendingAlert(userId: string, alert: InsertSpendingAlert): Promise<SpendingAlert>;
  updateSpendingAlert(userId: string, alertId: string, alert: Partial<InsertSpendingAlert>): Promise<SpendingAlert | undefined>;
  deleteSpendingAlert(userId: string, alertId: string): Promise<boolean>;
  checkSpendingAlerts(userId: string): Promise<Array<{ alert: SpendingAlertWithCategory; currentSpending: number; percentageUsed: number }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.createdAt);
  }

  async createCategory(userId: string, category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values({ ...category, userId })
      .returning();
    return newCategory;
  }

  async updateCategory(userId: string, categoryId: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(userId: string, categoryId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Transaction operations
  async getTransactions(userId: string): Promise<TransactionWithCategory[]> {
    return await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        categoryId: transactions.categoryId,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date,
        createdAt: transactions.createdAt,
        category: {
          id: categories.id,
          userId: categories.userId,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
          type: categories.type,
          createdAt: categories.createdAt,
        },
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }

  async createTransaction(userId: string, transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({ ...transaction, userId })
      .returning();
    return newTransaction;
  }

  async updateTransaction(userId: string, transactionId: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transaction)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Analytics
  async getMonthlyBalance(userId: string, year: number, month: number): Promise<{ income: number; expenses: number; balance: number }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const results = await db
      .select({
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`${transactions.date} >= ${startDate}`,
          sql`${transactions.date} <= ${endDate}`
        )
      )
      .groupBy(transactions.type);

    const income = Number(results.find(r => r.type === 'income')?.total || 0);
    const expenses = Number(results.find(r => r.type === 'expense')?.total || 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }

  async getCategoryExpenses(userId: string, year: number, month: number): Promise<Array<{ categoryId: string; categoryName: string; total: number; percentage: number }>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const results = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          sql`${transactions.date} >= ${startDate}`,
          sql`${transactions.date} <= ${endDate}`
        )
      )
      .groupBy(categories.id, categories.name);

    const totalExpenses = results.reduce((sum, item) => sum + Number(item.total), 0);

    return results.map(item => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      total: Number(item.total),
      percentage: totalExpenses > 0 ? Math.round((Number(item.total) / totalExpenses) * 100) : 0,
    }));
  }

  // Savings Goals operations
  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    return await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId))
      .orderBy(desc(savingsGoals.createdAt));
  }

  async createSavingsGoal(userId: string, goal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [newGoal] = await db
      .insert(savingsGoals)
      .values({ ...goal, userId })
      .returning();
    return newGoal;
  }

  async updateSavingsGoal(userId: string, goalId: string, goal: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined> {
    const [updatedGoal] = await db
      .update(savingsGoals)
      .set(goal)
      .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)))
      .returning();
    return updatedGoal;
  }

  async deleteSavingsGoal(userId: string, goalId: string): Promise<boolean> {
    const result = await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Spending Alerts operations
  async getSpendingAlerts(userId: string): Promise<SpendingAlertWithCategory[]> {
    return await db
      .select({
        id: spendingAlerts.id,
        userId: spendingAlerts.userId,
        categoryId: spendingAlerts.categoryId,
        name: spendingAlerts.name,
        limitAmount: spendingAlerts.limitAmount,
        period: spendingAlerts.period,
        isActive: spendingAlerts.isActive,
        createdAt: spendingAlerts.createdAt,
        category: categories,
      })
      .from(spendingAlerts)
      .leftJoin(categories, eq(spendingAlerts.categoryId, categories.id))
      .where(eq(spendingAlerts.userId, userId))
      .orderBy(desc(spendingAlerts.createdAt));
  }

  async createSpendingAlert(userId: string, alert: InsertSpendingAlert): Promise<SpendingAlert> {
    const [newAlert] = await db
      .insert(spendingAlerts)
      .values({ ...alert, userId })
      .returning();
    return newAlert;
  }

  async updateSpendingAlert(userId: string, alertId: string, alert: Partial<InsertSpendingAlert>): Promise<SpendingAlert | undefined> {
    const [updatedAlert] = await db
      .update(spendingAlerts)
      .set(alert)
      .where(and(eq(spendingAlerts.id, alertId), eq(spendingAlerts.userId, userId)))
      .returning();
    return updatedAlert;
  }

  async deleteSpendingAlert(userId: string, alertId: string): Promise<boolean> {
    const result = await db
      .delete(spendingAlerts)
      .where(and(eq(spendingAlerts.id, alertId), eq(spendingAlerts.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async checkSpendingAlerts(userId: string): Promise<Array<{ alert: SpendingAlertWithCategory; currentSpending: number; percentageUsed: number }>> {
    const alerts = await this.getSpendingAlerts(userId);
    const results = [];

    for (const alert of alerts.filter(a => a.isActive)) {
      let startDate: Date;
      const now = new Date();

      switch (alert.period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      let query = db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense'),
            sql`${transactions.date} >= ${startDate}`,
            sql`${transactions.date} <= ${now}`
          )
        );

      if (alert.categoryId) {
        query = query.where(eq(transactions.categoryId, alert.categoryId));
      }

      const [result] = await query;
      const currentSpending = Number(result?.total || 0);
      const limitAmount = Number(alert.limitAmount);
      const percentageUsed = limitAmount > 0 ? (currentSpending / limitAmount) * 100 : 0;

      results.push({
        alert,
        currentSpending,
        percentageUsed,
      });
    }

    return results;
  }
}

export const storage = new DatabaseStorage();
