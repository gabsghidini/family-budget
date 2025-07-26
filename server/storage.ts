import {
  users,
  categories,
  transactions,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type TransactionWithCategory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sum, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
}

export const storage = new DatabaseStorage();
