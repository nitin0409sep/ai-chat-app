import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // ssl: false,
});

export const db = drizzle({ client: pool });

// Graceful Shutdown Logic
async function shutdown() {
    try {
        console.log("Shutting down gracefully...");
        await pool.end(); // Close all DB connections
        console.log("Database pool closed.");
        process.exit(0);
    } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
}

// Handle termination signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);