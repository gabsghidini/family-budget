import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleNeon>;

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  // Use Neon for production
  const sql = neon(process.env.DATABASE_URL);
  db = drizzleNeon(sql, { schema });
} else {
  // Use SQLite for development
  const sqlite = new Database('./family-budget.db');
  db = drizzle(sqlite, { schema });
}

export { db };