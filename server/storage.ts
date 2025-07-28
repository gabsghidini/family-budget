import {
  users,
  categories,
  transactions,
  savingsGoals,
  spendingAlerts,
  familyGroups,
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
import { eq, and, desc, sum, sql, gte, lte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Family group operations
  getFamilyGroup(id: string): Promise<any>;
  getFamilyGroups(): Promise<any[]>;
  createFamilyGroup(name: string): Promise<any>;

  // Category operations
  getCategories(familyGroupId: string): Promise<Category[]>;
  createCategory(familyGroupId: string, userId: string, category: InsertCategory): Promise<Category>;
  updateCategory(familyGroupId: string, categoryId: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(familyGroupId: string, categoryId: string): Promise<boolean>;

  // Transaction operations
  getTransactions(familyGroupId: string): Promise<TransactionWithCategory[]>;
  createTransaction(familyGroupId: string, userId: string, transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(familyGroupId: string, transactionId: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(familyGroupId: string, transactionId: string): Promise<boolean>;

  // Analytics
  getMonthlyBalance(familyGroupId: string, year: number, month: number): Promise<{ income: number; expenses: number; balance: number }>;
  getCategoryExpenses(familyGroupId: string, year: number, month: number): Promise<Array<{ categoryId: string; categoryName: string; total: number; percentage: number }>>;

  // Savings Goals operations
  getSavingsGoals(familyGroupId: string): Promise<SavingsGoal[]>;
  createSavingsGoal(familyGroupId: string, userId: string, goal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal(familyGroupId: string, goalId: string, goal: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined>;
  deleteSavingsGoal(familyGroupId: string, goalId: string): Promise<boolean>;

  // Spending Alerts operations
  getSpendingAlerts(familyGroupId: string): Promise<SpendingAlertWithCategory[]>;
  createSpendingAlert(familyGroupId: string, userId: string, alert: InsertSpendingAlert): Promise<SpendingAlert>;
  updateSpendingAlert(familyGroupId: string, alertId: string, alert: Partial<InsertSpendingAlert>): Promise<SpendingAlert | undefined>;
  deleteSpendingAlert(familyGroupId: string, alertId: string): Promise<boolean>;
  checkSpendingAlerts(familyGroupId: string): Promise<Array<{ alert: SpendingAlertWithCategory; currentSpending: number; percentageUsed: number }>>;
}

export class DatabaseStorage implements IStorage {
  // Family group operations
  async getFamilyGroup(id: string): Promise<any> {
    const [group] = await db.select().from(familyGroups).where(eq(familyGroups.id, id));
    return group;
  }

  async getFamilyGroups(): Promise<any[]> {
    return await db.select().from(familyGroups).orderBy(familyGroups.createdAt);
  }

  async createFamilyGroup(name: string): Promise<any> {
    const [group] = await db.insert(familyGroups).values({ name }).returning();
    return group;
  }
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
  async getCategories(familyGroupId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.familyGroupId, familyGroupId))
      .orderBy(categories.createdAt);
  }

  async createCategory(familyGroupId: string, userId: string, category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values({ ...category, familyGroupId, userId })
      .returning();
    return newCategory;
  }

  async updateCategory(familyGroupId: string, categoryId: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(and(eq(categories.id, categoryId), eq(categories.familyGroupId, familyGroupId)))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(familyGroupId: string, categoryId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.familyGroupId, familyGroupId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Transaction operations
  async getTransactions(familyGroupId: string): Promise<TransactionWithCategory[]> {
    return await db
      .select({
        id: transactions.id,
        familyGroupId: transactions.familyGroupId,
        userId: transactions.userId,
        categoryId: transactions.categoryId,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date,
        isRecurring: transactions.isRecurring,
        recurringDay: transactions.recurringDay,
        createdAt: transactions.createdAt,
        category: {
          id: categories.id,
          familyGroupId: categories.familyGroupId,
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
      .where(eq(transactions.familyGroupId, familyGroupId))
      .orderBy(desc(transactions.date));
  }

  async createTransaction(familyGroupId: string, userId: string, transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        familyGroupId,
        userId,
        isRecurring: transaction.isRecurring ?? false,
        recurringDay: transaction.isRecurring ? transaction.recurringDay ?? null : null,
      })
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
    const startDate = new Date(year, month - 1, 1).getTime();
    const endDate = new Date(year, month, 0, 23, 59, 59).getTime();

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
    const startDate = new Date(year, month - 1, 1).getTime();
    const endDate = new Date(year, month, 0, 23, 59, 59).getTime();

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
  async getSavingsGoals(familyGroupId: string): Promise<SavingsGoal[]> {
    return await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.familyGroupId, familyGroupId))
      .orderBy(desc(savingsGoals.createdAt));
  }

  async createSavingsGoal(familyGroupId: string, userId: string, goal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [newGoal] = await db
      .insert(savingsGoals)
      .values({ ...goal, familyGroupId, userId })
      .returning();
    return newGoal;
  }

  async updateSavingsGoal(familyGroupId: string, goalId: string, goal: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined> {
    const [updatedGoal] = await db
      .update(savingsGoals)
      .set(goal)
      .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.familyGroupId, familyGroupId)))
      .returning();
    return updatedGoal;
  }

  async deleteSavingsGoal(familyGroupId: string, goalId: string): Promise<boolean> {
    const result = await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.familyGroupId, familyGroupId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Spending Alerts operations
  async getSpendingAlerts(familyGroupId: string): Promise<SpendingAlertWithCategory[]> {
    return await db
      .select({
        id: spendingAlerts.id,
        familyGroupId: spendingAlerts.familyGroupId,
        userId: spendingAlerts.userId,
        categoryId: spendingAlerts.categoryId,
        name: spendingAlerts.name,
        limitAmount: spendingAlerts.limitAmount,
        period: spendingAlerts.period,
        isActive: spendingAlerts.isActive,
        createdAt: spendingAlerts.createdAt,
        category: {
          id: categories.id,
          familyGroupId: categories.familyGroupId,
          userId: categories.userId,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
          type: categories.type,
          createdAt: categories.createdAt,
        },
      })
      .from(spendingAlerts)
      .leftJoin(categories, eq(spendingAlerts.categoryId, categories.id))
      .where(eq(spendingAlerts.familyGroupId, familyGroupId))
      .orderBy(desc(spendingAlerts.createdAt));
  }

  async createSpendingAlert(familyGroupId: string, userId: string, alert: InsertSpendingAlert): Promise<SpendingAlert> {
    const [newAlert] = await db
      .insert(spendingAlerts)
      .values({ ...alert, familyGroupId, userId })
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

  async checkSpendingAlerts(familyGroupId: string): Promise<Array<{ alert: SpendingAlertWithCategory; currentSpending: number; percentageUsed: number }>> {
    const alerts = await this.getSpendingAlerts(familyGroupId);
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

      const whereClause = [
        eq(transactions.familyGroupId, familyGroupId),
        eq(transactions.type, 'expense'),
        sql`${transactions.date} >= ${startDate.getTime()}`,
        sql`${transactions.date} <= ${now.getTime()}`
      ];
      if (alert.categoryId) {
        whereClause.push(eq(transactions.categoryId, alert.categoryId));
      }
      const [result] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(...whereClause));
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
