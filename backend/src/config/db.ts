import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config();

// A single shared pool is imported by repositories/services throughout the API.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
  console.error("Unexpected idle PostgreSQL client error:", error);
});
