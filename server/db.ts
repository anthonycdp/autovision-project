// CKDEV-NOTE: Using Drizzle ORM with node-postgres for type-safe database operations
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg; // CKDEV-NOTE: ES module compatibility workaround for pg package
import * as schema from "@shared/schema";

// CKDEV-NOTE: Fail-fast validation ensures database is properly configured before startup
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// CKDEV-NOTE: Connection pool manages multiple concurrent database connections
// Optimized pool configuration for better performance
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of clients in the pool
  min: 2,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
  allowExitOnIdle: true, // Allow the process to exit if no clients are connected
});
// CKDEV-NOTE: Drizzle instance with schema for type-safe queries throughout the app
export const db = drizzle(pool, { schema });