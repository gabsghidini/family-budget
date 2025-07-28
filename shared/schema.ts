// Family group invites
export const familyGroupInvites = sqliteTable("family_group_invites", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyGroupId: text("family_group_id").references(() => familyGroups.id, { onDelete: "cascade" }).notNull(),
  invitedUserId: text("invited_user_id").references(() => users.id, { onDelete: "cascade" }),
  invitedEmail: text("invited_email").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
// Family group table
export const familyGroups = sqliteTable("family_groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

import { sql, relations } from 'drizzle-orm';
import {
  index,
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire", { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table.
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyGroupId: text("family_group_id").references(() => familyGroups.id, { onDelete: "set null" }),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyGroupId: text("family_group_id").references(() => familyGroups.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("fa-tag"),
  color: text("color").notNull().default("#1976D2"),
  type: text("type").notNull().default("expense"), // "income" or "expense"
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyGroupId: text("family_group_id").references(() => familyGroups.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // "income" ou "expense"
  date: integer("date", { mode: 'timestamp' }).notNull(),
  isRecurring: integer("is_recurring", { mode: 'boolean' }).notNull().default(false),
  recurringDay: integer("recurring_day"), // dia do mês (1-31), opcional
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const savingsGoals = sqliteTable("savings_goals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyGroupId: text("family_group_id").references(() => familyGroups.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  targetDate: integer("target_date", { mode: 'timestamp' }),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const spendingAlerts = sqliteTable("spending_alerts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyGroupId: text("family_group_id").references(() => familyGroups.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  limitAmount: real("limit_amount").notNull(),
  period: text("period").notNull().default("monthly"), // "daily", "weekly", "monthly"
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Relations for family groups
export const familyGroupsRelations = relations(familyGroups, ({ many }) => ({
  users: many(users),
  categories: many(categories),
  transactions: many(transactions),
  savingsGoals: many(savingsGoals),
  spendingAlerts: many(spendingAlerts),

}));
// Relations
export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  transactions: many(transactions),
  savingsGoals: many(savingsGoals),
  spendingAlerts: many(spendingAlerts),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const savingsGoalsRelations = relations(savingsGoals, ({ one }) => ({
  user: one(users, {
    fields: [savingsGoals.userId],
    references: [users.id],
  }),
}));

export const spendingAlertsRelations = relations(spendingAlerts, ({ one }) => ({
  user: one(users, {
    fields: [spendingAlerts.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [spendingAlerts.categoryId],
    references: [categories.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  familyGroupId: true,
  userId: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  familyGroupId: true,
  userId: true,
  createdAt: true,
});

export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({
  id: true,
  familyGroupId: true,
  userId: true,
  createdAt: true,
});

export const insertSpendingAlertSchema = createInsertSchema(spendingAlerts).omit({
  id: true,
  familyGroupId: true,
  userId: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SpendingAlert = typeof spendingAlerts.$inferSelect;
export type InsertSpendingAlert = z.infer<typeof insertSpendingAlertSchema>;
export type TransactionWithCategory = Transaction & {
  category: Category;
};
export type SpendingAlertWithCategory = SpendingAlert & {
  category: Category | null;
};
