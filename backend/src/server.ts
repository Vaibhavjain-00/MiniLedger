import dotenv from "dotenv";
import app from "./app";
import { pool } from "./config/db";
dotenv.config();
const port = Number(process.env.PORT || 5000);

async function start() {
  try {
    if (!process.env.DATABASE_URL)
      throw new Error("DATABASE_URL is missing. Configure backend/.env.");
    if (!process.env.JWT_SECRET)
      throw new Error("JWT_SECRET is missing. Configure backend/.env.");
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected successfully");
    const server = app.listen(port, () =>
      console.log(`MiniLedger API running at http://localhost:${port}`),
    );
    const shutdown = () =>
      server.close(() => {
        void pool.end().finally(() => process.exit(0));
      });
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error(
      "Could not start MiniLedger. Check DATABASE_URL, JWT_SECRET and PostgreSQL setup.",
      error,
    );
    await pool.end();
    process.exit(1);
  }
}
void start();
